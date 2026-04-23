import Link from "next/link";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth()
  const isLoggedIn = !!userId

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 p-8">
        <div className="text-6xl font-bold text-indigo-600">💰</div>
        <h1 className="text-5xl font-bold text-gray-900">SavMon</h1>
        <p className="text-xl text-gray-600 max-w-md">
          Controla y organiza tus gastos mensuales de forma simple y clara.
        </p>

        <div className="flex gap-4 justify-center mt-8">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Ir al dashboard
            </Link>
          ) : (
            <>
              <SignUpButton mode="modal">
                <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                  Comenzar gratis
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="px-6 py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors">
                  Iniciar sesión
                </button>
              </SignInButton>
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6 mt-12 text-left">
          {[
            { icon: "📊", title: "Resumen mensual", desc: "Ve quién debe qué cada mes" },
            { icon: "💳", title: "Cuotas", desc: "Rastrea pagos en cuotas fácilmente" },
            { icon: "✅", title: "Estado", desc: "Marca gastos como pagados o pendientes" },
          ].map((f) => (
            <div key={f.title} className="bg-white p-5 rounded-2xl shadow-sm">
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-gray-800">{f.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
