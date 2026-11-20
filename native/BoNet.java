package com.blackout.log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.util.HashSet;
import java.util.HashMap;
import java.util.Iterator;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import android.content.Context;
import android.net.wifi.WifiManager;

/** BLACKOUT local network bridge: TCP request/response and sessions, UDP discovery (Solarman, Tuya), HTTPS for one-off cloud key lookups. */
@CapacitorPlugin(name = "BoNet")
public class BoNet extends Plugin {

    private static byte[] unhex(String h) {
        h = h.replaceAll("[^0-9a-fA-F]", "");
        byte[] b = new byte[h.length() / 2];
        for (int i = 0; i < b.length; i++) b[i] = (byte) Integer.parseInt(h.substring(i * 2, i * 2 + 2), 16);
        return b;
    }

    private static String hex(byte[] b, int n) {
        StringBuilder s = new StringBuilder();
        for (int i = 0; i < n; i++) s.append(String.format("%02x", b[i] & 0xff));
        return s.toString();
    }

    /** {host, port, hex, timeout(ms), quiet(ms)} -> {hex}. Connects, writes, reads until the stream is quiet. */
    @PluginMethod
    public void tcp(final PluginCall call) {
        final String host = call.getString("host");
        final int port = call.getInt("port", 8899);
        final String data = call.getString("hex", "");
        final int timeout = call.getInt("timeout", 5000);
        final int quiet = call.getInt("quiet", 350);
        if (host == null || host.isEmpty()) { call.reject("no host"); return; }
        new Thread(() -> {
            Socket s = new Socket();
            try {
                s.connect(new InetSocketAddress(host, port), timeout);
                s.setSoTimeout(timeout);
                OutputStream o = s.getOutputStream();
                o.write(unhex(data));
                o.flush();
                InputStream in = s.getInputStream();
                ByteArrayOutputStream acc = new ByteArrayOutputStream();
                byte[] buf = new byte[2048];
                int n = in.read(buf);
                if (n > 0) acc.write(buf, 0, n);
                s.setSoTimeout(quiet);
                while (n > 0) {
                    try { n = in.read(buf); if (n > 0) acc.write(buf, 0, n); } catch (SocketTimeoutException e) { break; }
                }
                byte[] r = acc.toByteArray();
                JSObject ret = new JSObject();
                ret.put("hex", hex(r, r.length));
                call.resolve(ret);
            } catch (SocketTimeoutException e) {
                call.reject("timeout");
            } catch (Exception e) {
                call.reject(String.valueOf(e.getMessage()));
            } finally {
                try { s.close(); } catch (Exception ignored) {}
            }
        }).start();
    }

    /** Solarman logger discovery: UDP broadcast "WIFIKIT-214028-READ" to port 48899, replies "ip,mac,serial". */
    @PluginMethod
    public void discover(final PluginCall call) {
        final int timeout = call.getInt("timeout", 2500);
        new Thread(() -> {
            DatagramSocket ds = null;
            try {
                ds = new DatagramSocket();
                ds.setBroadcast(true);
                ds.setSoTimeout(400);
                byte[] q = "WIFIKIT-214028-READ".getBytes("US-ASCII");
                ds.send(new DatagramPacket(q, q.length, InetAddress.getByName("255.255.255.255"), 48899));
                JSArray items = new JSArray();
                HashSet<String> seen = new HashSet<>();
                long end = System.currentTimeMillis() + timeout;
                byte[] buf = new byte[512];
                while (System.currentTimeMillis() < end) {
                    DatagramPacket p = new DatagramPacket(buf, buf.length);
                    try { ds.receive(p); } catch (SocketTimeoutException e) { continue; }
                    String t = new String(p.getData(), 0, p.getLength(), "US-ASCII").trim();
                    String[] f = t.split(",");
                    if (f.length >= 3 && seen.add(f[2])) {
                        JSObject it = new JSObject();
                        it.put("ip", f[0]); it.put("mac", f[1]); it.put("serial", f[2]);
                        items.put(it);
                    }
                }
                JSObject ret = new JSObject();
                ret.put("items", items);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject(String.valueOf(e.getMessage()));
            } finally {
                if (ds != null) ds.close();
            }
        }).start();
    }
    private final HashMap<Integer, Socket> sessions = new HashMap<>();
    private int nextId = 1;

    /** {host, port, timeout} -> {id}: keeps a TCP connection open for multi-step protocols (Tuya 3.4/3.5 session keys). */
    @PluginMethod
    public void tcpOpen(final PluginCall call) {
        final String host = call.getString("host");
        final int port = call.getInt("port", 6668);
        final int timeout = call.getInt("timeout", 5000);
        if (host == null || host.isEmpty()) { call.reject("no host"); return; }
        new Thread(() -> {
            try {
                Socket s = new Socket();
                s.connect(new InetSocketAddress(host, port), timeout);
                s.setTcpNoDelay(true);
                int id;
                synchronized (sessions) { id = nextId++; sessions.put(id, s); }
                JSObject ret = new JSObject(); ret.put("id", id); call.resolve(ret);
            } catch (SocketTimeoutException e) { call.reject("timeout");
            } catch (Exception e) { call.reject(String.valueOf(e.getMessage())); }
        }).start();
    }

    private Socket sess(PluginCall call) {
        Integer id = call.getInt("id", -1);
        synchronized (sessions) { return sessions.get(id); }
    }

    /** {id, hex} */
    @PluginMethod
    public void tcpWrite(final PluginCall call) {
        final Socket s = sess(call);
        final String data = call.getString("hex", "");
        if (s == null) { call.reject("closed"); return; }
        new Thread(() -> {
            try { OutputStream o = s.getOutputStream(); o.write(unhex(data)); o.flush(); call.resolve(new JSObject());
            } catch (Exception e) { call.reject(String.valueOf(e.getMessage())); }
        }).start();
    }

    /** {id, timeout, quiet} -> {hex}: waits up to timeout for the first bytes, then reads until quiet. Empty hex = nothing arrived. */
    @PluginMethod
    public void tcpRead(final PluginCall call) {
        final Socket s = sess(call);
        final int timeout = call.getInt("timeout", 3000);
        final int quiet = call.getInt("quiet", 300);
        if (s == null) { call.reject("closed"); return; }
        new Thread(() -> {
            ByteArrayOutputStream acc = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            try {
                InputStream in = s.getInputStream();
                s.setSoTimeout(timeout);
                int n;
                try { n = in.read(buf); } catch (SocketTimeoutException e) { n = 0; }
                if (n < 0) { call.reject("closed by device"); return; }
                if (n > 0) acc.write(buf, 0, n);
                s.setSoTimeout(quiet);
                while (n > 0) {
                    try { n = in.read(buf); if (n > 0) acc.write(buf, 0, n); } catch (SocketTimeoutException e) { break; }
                }
                byte[] r = acc.toByteArray();
                JSObject ret = new JSObject(); ret.put("hex", hex(r, r.length)); call.resolve(ret);
            } catch (Exception e) { call.reject(String.valueOf(e.getMessage())); }
        }).start();
    }

    /** {id} */
    @PluginMethod
    public void tcpClose(final PluginCall call) {
        Integer id = call.getInt("id", -1);
        Socket s;
        synchronized (sessions) { s = sessions.remove(id); }
        try { if (s != null) s.close(); } catch (Exception ignored) {}
        call.resolve(new JSObject());
    }

    /** {ports:[6666,6667], timeout} -> {items:[{ip, port, hex}]}: listens for device broadcasts (Tuya announces itself every few seconds). */
    @PluginMethod
    public void udpListen(final PluginCall call) {
        final int timeout = call.getInt("timeout", 6000);
        final int[] ports = {6666, 6667};
        new Thread(() -> {
            WifiManager.MulticastLock lock = null;
            DatagramSocket[] socks = new DatagramSocket[ports.length];
            try {
                try {
                    WifiManager wm = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                    if (wm != null) { lock = wm.createMulticastLock("blackout-discovery"); lock.setReferenceCounted(false); lock.acquire(); }
                } catch (Exception ignored) {}
                for (int i = 0; i < ports.length; i++) {
                    try { DatagramSocket d = new DatagramSocket(null); d.setReuseAddress(true); d.setBroadcast(true); d.bind(new InetSocketAddress(ports[i])); d.setSoTimeout(200); socks[i] = d; } catch (Exception ignored) {}
                }
                JSArray items = new JSArray();
                HashSet<String> seen = new HashSet<>();
                long end = System.currentTimeMillis() + timeout;
                byte[] buf = new byte[2048];
                while (System.currentTimeMillis() < end) {
                    for (int i = 0; i < socks.length; i++) {
                        if (socks[i] == null) continue;
                        DatagramPacket p = new DatagramPacket(buf, buf.length);
                        try { socks[i].receive(p); } catch (SocketTimeoutException e) { continue; }
                        String h = hex(p.getData(), p.getLength());
                        String ip = p.getAddress().getHostAddress();
                        if (seen.add(ip + h.length())) {
                            JSObject it = new JSObject(); it.put("ip", ip); it.put("port", ports[i]); it.put("hex", h); items.put(it);
                        }
                    }
                }
                JSObject ret = new JSObject(); ret.put("items", items); call.resolve(ret);
            } catch (Exception e) { call.reject(String.valueOf(e.getMessage()));
            } finally {
                for (DatagramSocket d : socks) if (d != null) d.close();
                if (lock != null) try { lock.release(); } catch (Exception ignored) {}
            }
        }).start();
    }

    /** {url, method, headers:{}, body} -> {status, body}: HTTPS for one-off cloud lookups (e.g. Tuya local keys). Nothing is stored. */
    @PluginMethod
    public void http(final PluginCall call) {
        final String url = call.getString("url");
        final String method = call.getString("method", "GET");
        final String body = call.getString("body", null);
        final JSObject headers = call.getObject("headers", new JSObject());
        if (url == null || !url.startsWith("https://")) { call.reject("https only"); return; }
        new Thread(() -> {
            HttpURLConnection c = null;
            try {
                c = (HttpURLConnection) new URL(url).openConnection();
                c.setRequestMethod(method); c.setConnectTimeout(8000); c.setReadTimeout(10000);
                Iterator<String> keys = headers.keys();
                while (keys.hasNext()) { String k = keys.next(); c.setRequestProperty(k, headers.getString(k)); }
                if (body != null) { c.setDoOutput(true); c.getOutputStream().write(body.getBytes("UTF-8")); }
                int code = c.getResponseCode();
                InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
                StringBuilder sb = new StringBuilder();
                if (in != null) { BufferedReader r = new BufferedReader(new InputStreamReader(in, "UTF-8")); String line; while ((line = r.readLine()) != null) sb.append(line); }
                JSObject ret = new JSObject(); ret.put("status", code); ret.put("body", sb.toString()); call.resolve(ret);
            } catch (Exception e) { call.reject(String.valueOf(e.getMessage()));
            } finally { if (c != null) c.disconnect(); }
        }).start();
    }
}
