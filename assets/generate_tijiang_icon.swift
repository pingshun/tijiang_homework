import AppKit
import Foundation

let size = 512
let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: size,
    pixelsHigh: size,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
)!
bitmap.size = NSSize(width: size, height: size)
let graphics = NSGraphicsContext(bitmapImageRep: bitmap)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = graphics
graphics.imageInterpolation = .high
graphics.shouldAntialias = true

NSColor(calibratedRed: 40 / 255, green: 90 / 255, blue: 67 / 255, alpha: 1).setFill()
NSBezierPath(roundedRect: NSRect(x: 0, y: 0, width: 512, height: 512), xRadius: 112, yRadius: 112).fill()

let sheetColor = NSColor(calibratedRed: 251 / 255, green: 250 / 255, blue: 245 / 255, alpha: 1)
sheetColor.setFill()
NSBezierPath(roundedRect: NSRect(x: 64, y: 52, width: 384, height: 408), xRadius: 38, yRadius: 38).fill()

let fold = NSBezierPath()
fold.move(to: NSPoint(x: 336, y: 460))
fold.line(to: NSPoint(x: 448, y: 348))
fold.line(to: NSPoint(x: 448, y: 460))
fold.close()
NSColor(calibratedRed: 237 / 255, green: 198 / 255, blue: 94 / 255, alpha: 1).setFill()
fold.fill()

let mathStyle = NSMutableParagraphStyle()
mathStyle.alignment = .center
let mathFont = NSFont(name: "AvenirNext-DemiBold", size: 27) ?? NSFont.systemFont(ofSize: 27, weight: .semibold)
let mathAttributes: [NSAttributedString.Key: Any] = [
    .font: mathFont,
    .foregroundColor: NSColor(calibratedRed: 216 / 255, green: 119 / 255, blue: 76 / 255, alpha: 1),
    .paragraphStyle: mathStyle
]
("＋  ×  −" as NSString).draw(in: NSRect(x: 126, y: 354, width: 260, height: 42), withAttributes: mathAttributes)

let titleStyle = NSMutableParagraphStyle()
titleStyle.alignment = .center
let titleFont = NSFont(name: "PingFangSC-Semibold", size: 91) ?? NSFont.systemFont(ofSize: 91, weight: .semibold)
let titleAttributes: [NSAttributedString.Key: Any] = [
    .font: titleFont,
    .foregroundColor: NSColor(calibratedRed: 40 / 255, green: 90 / 255, blue: 67 / 255, alpha: 1),
    .paragraphStyle: titleStyle
]
("题匠" as NSString).draw(in: NSRect(x: 94, y: 210, width: 324, height: 118), withAttributes: titleAttributes)

NSColor(calibratedRed: 216 / 255, green: 119 / 255, blue: 76 / 255, alpha: 1).setFill()
NSBezierPath(roundedRect: NSRect(x: 194, y: 183, width: 124, height: 8), xRadius: 4, yRadius: 4).fill()

let lineColor = NSColor(calibratedRed: 217 / 255, green: 223 / 255, blue: 212 / 255, alpha: 1)
lineColor.setFill()
for y in [139, 116] {
    NSBezierPath(roundedRect: NSRect(x: 138, y: y, width: 236, height: 8), xRadius: 4, yRadius: 4).fill()
}

NSGraphicsContext.restoreGraphicsState()
let png = bitmap.representation(using: .png, properties: [:])!
let manager = FileManager.default
let current = URL(fileURLWithPath: manager.currentDirectoryPath)
for directory in [current.appendingPathComponent("assets"), current.appendingPathComponent("miniprogram/assets")] {
    try manager.createDirectory(at: directory, withIntermediateDirectories: true)
    try png.write(to: directory.appendingPathComponent("tijiang-icon.png"), options: .atomic)
}
print("Generated 512x512 tijiang-icon.png for web and mini program")
