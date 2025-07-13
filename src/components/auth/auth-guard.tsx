'use client'

import { useAuth } from '@/contexts/auth-context'
import { Loading } from '@/components/ui/loading'

interface AuthGuardProps {
    children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { user, loading } = useAuth()

    if (loading) {
        return <Loading />
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Authentication Required
                    </h2>
                    <p className="text-gray-600">
                        Please sign in to access this page.
                    </p>
                </div>
            </div>
        )
    }

    return <>{children}</>
} 