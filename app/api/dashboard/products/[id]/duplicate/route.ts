export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/auth/session"
import { connectToDatabase } from "@/lib/db/connection"
import Vendor from "@/lib/db/models/vendor"
import Product from "@/lib/db/models/product"

export async function POST(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { user } = await requireUser()
        await connectToDatabase()

        const vendor = await Vendor.findOne({ user_id: user.id }).lean()
        if (!vendor) {
            return new NextResponse("Vendor profile not found", { status: 404 })
        }

        const existingProduct = await Product.findById(params.id).lean()
        if (!existingProduct) {
            return new NextResponse("Product not found", { status: 404 })
        }

        if (existingProduct.vendor_id?.toString() !== vendor._id?.toString()) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const duplicateTitle = `${existingProduct.title} (Copy)`

        const duplicated = await Product.create({
            vendor_id: vendor._id,
            category_id: existingProduct.category_id || undefined,
            title: duplicateTitle,
            description: existingProduct.description || undefined,
            price: typeof existingProduct.price === "number" ? existingProduct.price : 0,
            stock: typeof existingProduct.stock === "number" ? existingProduct.stock : 0,
            images: Array.isArray(existingProduct.images) ? existingProduct.images : [],
            colors: Array.isArray((existingProduct as any).colors) ? (existingProduct as any).colors : [],
            sizes: Array.isArray((existingProduct as any).sizes) ? (existingProduct as any).sizes : [],
            weight: (existingProduct as any).weight,
            attributes: existingProduct.attributes || {},
            status: "draft",
        })

        const productId = (duplicated as any).id || duplicated._id?.toString()

        return NextResponse.json({
            success: true,
            productId,
            message: "Product duplicated successfully"
        })

    } catch (error) {
        console.error("Duplicate product error:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
