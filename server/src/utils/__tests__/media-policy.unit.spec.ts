import { assertMediaFile } from "../media-policy"

describe("media policy", () => {
  it("accepts supported image formats", () => {
    expect(() => assertMediaFile({ mimetype: "image/webp", size: 1024 })).not.toThrow()
  })

  it("rejects executable/unknown types", () => {
    expect(() => assertMediaFile({ mimetype: "application/x-msdownload", size: 1024 })).toThrow(
      /Unsupported media type/
    )
  })

  it("rejects files over the configured maximum", () => {
    process.env.MEDIA_MAX_FILE_SIZE_MB = "1"
    expect(() => assertMediaFile({ mimetype: "image/png", size: 2 * 1024 * 1024 })).toThrow(
      /Media file must/
    )
    delete process.env.MEDIA_MAX_FILE_SIZE_MB
  })
})
