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

/** BLACKOUT local network bridge for inverters: one TCP request/response and Solarman logger discovery. Read-only use. */
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
}
