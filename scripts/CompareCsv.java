import java.nio.file.*;
import java.util.*;

public class CompareCsv {
  public static void main(String[] args) throws Exception {
    if (args.length != 2) throw new IllegalArgumentException("Usage: java CompareCsv a.csv b.csv");
    byte[] a = Files.readAllBytes(Path.of(args[0]));
    byte[] b = Files.readAllBytes(Path.of(args[1]));
    if (!Arrays.equals(a, b)) {
      String as = Files.readString(Path.of(args[0]));
      String bs = Files.readString(Path.of(args[1]));
      int n = Math.min(as.length(), bs.length());
      int pos = 0;
      while (pos < n && as.charAt(pos) == bs.charAt(pos)) pos++;
      throw new AssertionError("CSV differs at char " + pos + "\nA: " + as.substring(Math.max(0,pos-80), Math.min(as.length(),pos+160)) + "\nB: " + bs.substring(Math.max(0,pos-80), Math.min(bs.length(),pos+160)));
    }
    System.out.println("CSV byte-for-byte match: " + args[0] + " == " + args[1]);
  }
}
