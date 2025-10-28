import { Suspense } from "react"
import { RegisterForm } from "@/components/auth/register-form"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Xinsd 苍蝇饭馆
          </h1>
          <p className="text-gray-600">
            想吃什么点什么
          </p>
        </div>
        
        <Suspense
          fallback={
            <Card className="w-full max-w-md mx-auto">
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          }
        >
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  )
}

export const metadata = {
  title: "注册 - Xinsd 苍蝇饭馆",
  description: "创建您的账户来访问点菜平台",
}