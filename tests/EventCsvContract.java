import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

public class EventCsvContract {
  static final String[] COLUMNS = {"uid","title","shortTitle","category","lane","sub","start","endKnown","endInferred","href","timeZone","timeZoneLabel","isFixedTimeZone","source","firstSeenAt","lastSeenAt","lastScrapedAt","status"};
  static String esc(String v){
    if(v == null) v = "";
    boolean q = v.indexOf(',')>=0 || v.indexOf('"')>=0 || v.indexOf('\n')>=0 || v.indexOf('\r')>=0;
    if(!q) return v;
    return "\"" + v.replace("\"", "\"\"") + "\"";
  }
  static Map<String,String> row(String... kv){
    Map<String,String> m = new LinkedHashMap<>();
    for(int i=0;i+1<kv.length;i+=2) m.put(kv[i], kv[i+1]);
    return m;
  }
  public static void main(String[] args) throws Exception{
    Path out = Paths.get(args.length>0 ? args[0] : "java_events.csv");
    Files.createDirectories(out.getParent());
    List<Map<String,String>> rows = List.of(
      row("uid","neatduck-test-001","title","Memories in Motion Season","shortTitle","Memories in Motion","category","Season","lane","season","sub","Season","start","2026-03-03T10:00:00","endKnown","2026-06-02T10:00:00","endInferred","","href","https://leekduck.com/events/memories-in-motion-season","timeZone","local","timeZoneLabel","Local Time","isFixedTimeZone","","source","github-fixture","firstSeenAt","2026-05-30T00:00:00Z","lastSeenAt","2026-05-30T00:00:00Z","lastScrapedAt","2026-05-30T00:00:00Z","status","active"),
      row("uid","neatduck-test-002","title","GO Fest: Paris, Day 1","shortTitle","GO Fest Paris","category","Live Event","lane","theme","sub","Live Events","start","2026-06-13T09:00:00Z","endKnown","2026-06-13T18:00:00Z","endInferred","","href","https://leekduck.com/events/go-fest-paris","timeZone","Europe/Paris","timeZoneLabel","CEST","isFixedTimeZone","1","source","github-fixture","firstSeenAt","2026-05-30T00:00:00Z","lastSeenAt","2026-05-30T00:00:00Z","lastScrapedAt","2026-05-30T00:00:00Z","status","active")
    );
    StringBuilder sb = new StringBuilder();
    sb.append(String.join(",", COLUMNS)).append('\n');
    for(Map<String,String> r: rows){
      for(int i=0;i<COLUMNS.length;i++){ if(i>0) sb.append(','); sb.append(esc(r.getOrDefault(COLUMNS[i], ""))); }
      sb.append('\n');
    }
    Files.writeString(out, sb.toString(), StandardCharsets.UTF_8);
  }
}
