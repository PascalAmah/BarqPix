"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Scan, Camera, Type } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface BarcodeScannerProps {
  onScanComplete: (userId: string) => void
  onViewChange: (view: string) => void
}

export default function BarcodeScanner({ onScanComplete, onViewChange }: BarcodeScannerProps) {
  const [manualId, setManualId] = useState("")
  const [scanning, setScanning] = useState(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualId.trim()) {
      onScanComplete(manualId.trim())
      setLastScanned(manualId.trim())
      onViewChange("upload")
    }
  }

  const simulateScan = () => {
    setScanning(true)
    // Simulate scanning delay
    setTimeout(() => {
      const mockUserId = `user_${Date.now()}`
      onScanComplete(mockUserId)
      setLastScanned(mockUserId)
      setScanning(false)
      onViewChange("upload")
    }, 2000)
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Scan className="w-6 h-6" />
            Scan QR Code
          </CardTitle>
          <CardDescription>Scan a participant's QR code to link photos to their account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="camera" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera">Camera Scan</TabsTrigger>
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="space-y-4">
              <div className="text-center space-y-4">
                <div className="bg-gray-100 rounded-lg p-8 border-2 border-dashed border-gray-300">
                  {scanning ? (
                    <div className="space-y-4">
                      <div className="animate-pulse">
                        <Camera className="w-16 h-16 mx-auto text-blue-600" />
                      </div>
                      <p className="text-sm text-muted-foreground">Scanning...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Camera className="w-16 h-16 mx-auto text-gray-400" />
                      <p className="text-sm text-muted-foreground">Camera viewfinder will appear here</p>
                    </div>
                  )}
                </div>

                <Button onClick={simulateScan} disabled={scanning} className="w-full">
                  {scanning ? "Scanning..." : "Start Camera Scan"}
                </Button>

                <p className="text-xs text-muted-foreground">Note: Camera access required for QR code scanning</p>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID or QR Code Data</Label>
                  <Input
                    id="userId"
                    type="text"
                    placeholder="Enter user ID manually"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Type className="w-4 h-4 mr-2" />
                  Link Photos to User
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {lastScanned && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">✓ Last scanned: {lastScanned}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
