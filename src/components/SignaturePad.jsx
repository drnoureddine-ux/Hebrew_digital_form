import React, { useRef, useEffect, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Trash2, Download } from 'lucide-react'

const SignaturePad = ({ value, onChange, width = 200, height = 80, label = "חתימה" }) => {
  const sigRef = useRef(null)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    if (value && sigRef.current) {
      sigRef.current.fromDataURL(value)
      setIsEmpty(false)
    }
  }, [value])

  const handleClear = () => {
    if (sigRef.current) {
      sigRef.current.clear()
      setIsEmpty(true)
      onChange('')
    }
  }

  const handleEnd = () => {
    if (sigRef.current) {
      const dataURL = sigRef.current.toDataURL()
      setIsEmpty(sigRef.current.isEmpty())
      onChange(dataURL)
    }
  }

  const handleSave = () => {
    if (sigRef.current && !isEmpty) {
      const dataURL = sigRef.current.toDataURL()
      const link = document.createElement('a')
      link.download = 'signature.png'
      link.href = dataURL
      link.click()
    }
  }

  return (
    <div className="signature-pad-container">
      <div className="text-sm mb-2 text-center">{label}</div>
      <div className="border border-gray-400 bg-white" style={{ width, height }}>
        <SignatureCanvas
          ref={sigRef}
          canvasProps={{
            width: width,
            height: height,
            className: 'signature-canvas'
          }}
          backgroundColor="white"
          penColor="black"
          minWidth={1}
          maxWidth={2}
          onEnd={handleEnd}
        />
      </div>
      <div className="flex justify-center gap-2 mt-2">
        <Button
          type="button"
          onClick={handleClear}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          <Trash2 className="w-3 h-3 ml-1" />
          נקה
        </Button>
        {!isEmpty && (
          <Button
            type="button"
            onClick={handleSave}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            <Download className="w-3 h-3 ml-1" />
            שמור
          </Button>
        )}
      </div>
    </div>
  )
}

export default SignaturePad
