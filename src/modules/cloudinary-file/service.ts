import { AbstractFileProviderService, MedusaError } from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"
import type {
  ProviderUploadFileDTO,
  ProviderFileResultDTO,
  ProviderDeleteFileDTO,
  ProviderGetFileDTO,
} from "@medusajs/framework/types"
import { v2 as cloudinary } from "cloudinary"
import path from "path"

type InjectedDependencies = {
  logger: Logger
}

type Options = {
  cloud_name: string
  api_key: string
  api_secret: string
  folder?: string
}

class CloudinaryFileProviderService extends AbstractFileProviderService {
  static identifier = "cloudinary"

  protected logger_: Logger
  protected options_: Options

  constructor({ logger }: InjectedDependencies, options: Options) {
    super()
    this.logger_ = logger
    this.options_ = options
    cloudinary.config({
      cloud_name: options.cloud_name,
      api_key: options.api_key,
      api_secret: options.api_secret,
      secure: true,
    })
  }

  static validateOptions(options: Record<string, any>) {
    for (const key of ["cloud_name", "api_key", "api_secret"]) {
      if (!options[key]) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Cloudinary option "${key}" is required`
        )
      }
    }
  }

  async upload(file: ProviderUploadFileDTO): Promise<ProviderFileResultDTO> {
    const parsed = path.parse(file.filename)
    const mime = file.mimeType || ""
    // Content is base64 in recent Medusa versions, with a legacy binary-string fallback
    const asBase64 = Buffer.from(file.content, "base64")
    const buffer =
      asBase64.toString("base64") === file.content
        ? asBase64
        : Buffer.from(file.content, "binary")
    const resourceType = mime.startsWith("image/")
      ? "image"
      : mime.startsWith("video/")
        ? "video"
        : "raw"
    const safeName = parsed.name.replace(/[^a-zA-Z0-9_-]+/g, "-")
    // raw assets need the extension in the public_id to be served correctly
    const publicId =
      `${safeName}-${Date.now()}` + (resourceType === "raw" ? parsed.ext : "")

    try {
      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: resourceType,
              folder: this.options_.folder,
              public_id: publicId,
            },
            (err, res) => (err ? reject(err) : resolve(res))
          )
          .end(buffer)
      })
      return { url: result.secure_url, key: result.public_id }
    } catch (e: any) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Cloudinary upload failed: ${e?.message ?? e}`
      )
    }
  }

  async delete(file: ProviderDeleteFileDTO): Promise<void> {
    // Cloudinary needs the right resource_type; try image, then video, then raw.
    for (const resource_type of ["image", "video", "raw"]) {
      const res = await cloudinary.uploader.destroy(file.fileKey, {
        resource_type: resource_type as any,
        invalidate: true,
      })
      if (res.result === "ok") return
    }
  }

  async getPresignedDownloadUrl(file: ProviderGetFileDTO): Promise<string> {
    return cloudinary.url(file.fileKey, { secure: true, sign_url: true })
  }
}

export default CloudinaryFileProviderService
