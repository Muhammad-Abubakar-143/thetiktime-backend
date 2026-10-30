import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, HttpTypes } from "@medusajs/types"
import { Button, Container, Heading, Input, toast } from "@medusajs/ui"
import { useUpdateProduct } from "@medusajs/dashboard/hooks"
import { useEffect, useState, type FormEvent } from "react"

const watchAttributes = [
  { key: "model", label: "Model" },
  { key: "movement", label: "Movement" },
  { key: "display", label: "Display" },
  { key: "dial_color", label: "Dial Color" },
  { key: "case_material", label: "Case Material" },
  { key: "strap_material", label: "Strap Material" },
  { key: "strap_color", label: "Strap Color" },
  { key: "dial_size", label: "Dial Size" },
  { key: "style", label: "Style" },
  { key: "lock", label: "Lock" },
] as const

type AttributeKey = (typeof watchAttributes)[number]["key"]
type AttributeValues = Record<AttributeKey, string>

const getAttributeValues = (
  metadata: HttpTypes.AdminProduct["metadata"]
): AttributeValues =>
  Object.fromEntries(
    watchAttributes.map(({ key }) => [
      key,
      typeof metadata?.[key] === "string" ? metadata[key] : "",
    ])
  ) as AttributeValues

const ProductWatchAttributes = ({
  data: product,
}: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const [values, setValues] = useState(() =>
    getAttributeValues(product.metadata)
  )
  const { mutateAsync, isPending } = useUpdateProduct(product.id)

  useEffect(() => {
    setValues(getAttributeValues(product.metadata))
  }, [product.id, product.metadata])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const metadata = { ...product.metadata }
    watchAttributes.forEach(({ key }) => {
      const value = values[key].trim()

      if (value) {
        metadata[key] = value
      } else {
        delete metadata[key]
      }
    })

    try {
      await mutateAsync({ metadata })
      toast.success("Watch attributes saved")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save attributes"
      )
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Watch Attributes</Heading>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-4">
          {watchAttributes.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-y-1">
              <label
                className="text-ui-fg-subtle txt-compact-small"
                htmlFor={`watch-attribute-${key}`}
              >
                {label}
              </label>
              <Input
                id={`watch-attribute-${key}`}
                value={values[key]}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end px-6 py-4">
          <Button type="submit" size="small" isLoading={isPending}>
            Save attributes
          </Button>
        </div>
      </form>
    </Container>
  )
}

export const config = defineWidgetConfig({
  id: "thetiktime-watch-attributes-main",
  zone: "product.details.before",
})

export default ProductWatchAttributes
