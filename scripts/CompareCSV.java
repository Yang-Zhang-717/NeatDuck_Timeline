import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public class CompareCSV {
  private static String norm(String s) {
    return s.replace("\r\n", "\n").replaceAll("\n+$", "");
  }
  public static void main(String[] args) throws Exception {
    if (args.length != 2) {
      System.err.println("usage: java CompareCSV <a.csv> <b.csv>");
      System.exit(2);
    }
    String a = norm(Files.readString(Path.of(args[0]), StandardCharsets.UTF_8));
    String b = norm(Files.readString(Path.of(args[1]), StandardCharsets.UTF_8));
    if (!a.equals(b)) {
      int max = Math.min(a.length(), b.length());
      int i = 0;
      while (i < max && a.charAt(i) == b.charAt(i)) i++;
      System.err.println("CSV mismatch at byte/char " + i);
      System.err.println("A: " + a.substring(Math.max(0, i - 80), Math.min(a.length(), i + 160)));
      System.err.println("B: " + b.substring(Math.max(0, i - 80), Math.min(b.length(), i + 160)));
      System.exit(1);
    }
    System.out.println("CSV identical");
  }
}
