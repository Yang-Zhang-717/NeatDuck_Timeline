import java.nio.file.*;
import java.util.zip.*;

public class ExcelProbe {
  public static void main(String[] args) throws Exception {
    if (args.length == 0) throw new IllegalArgumentException("xlsx path required");
    Path p = Paths.get(args[0]);
    try (ZipFile z = new ZipFile(p.toFile())) {
      ZipEntry sheet = z.getEntry("xl/worksheets/sheet1.xml");
      ZipEntry wb = z.getEntry("xl/workbook.xml");
      if (sheet == null || wb == null) throw new IllegalStateException("missing workbook parts");
      String xml = new String(z.getInputStream(sheet).readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
      int rows = xml.split("<row ", -1).length - 1;
      int cells = xml.split("<c ", -1).length - 1;
      System.out.println(p.getFileName() + " rows=" + rows + " cells=" + cells);
      if (rows < 1 || cells < 1) throw new IllegalStateException("empty sheet");
    }
  }
}
