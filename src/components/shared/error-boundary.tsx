"use client"

import { Component } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Dashboard error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Card className="max-w-xl mx-auto mt-8">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-red-400">Algo deu errado</h2>
              <p className="text-sm text-zinc-400 font-mono bg-zinc-800 p-3 rounded-lg">
                {this.state.error?.message || "Erro desconhecido"}
              </p>
              {this.state.error?.stack && (
                <details className="text-xs text-zinc-500">
                  <summary className="cursor-pointer hover:text-zinc-300">Stack trace</summary>
                  <pre className="mt-2 p-2 bg-zinc-800 rounded overflow-auto max-h-40">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              <Button onClick={() => window.location.reload()}>Recarregar</Button>
            </CardContent>
          </Card>
        )
      )
    }

    return this.props.children
  }
}
