import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Download, ZoomIn, ZoomOut, Mail, Send } from 'lucide-react'
import SignaturePad from './components/SignaturePad'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import './App.css'

function App() {
  const [formData, setFormData] = useState({
    // Form A fields
    name: '',
    address: '',
    idChars: Array(9).fill(''), // Changed to 9 for 9-digit ID
    agentName: '',
    licenseNumber: '',
    checkbox1: false,
    checkbox2: false,
    checkbox3: false,
    phone: '',
    email: '',
    signatureDate1: '',
    signature1: '', // This will now store the signature data URL
    
    // Form B fields
    recipient: '',
    nameB: '',
    idCharsB: Array(9).fill(''), // Changed to 9 for 9-digit ID
    tableField1: '',
    tableField2: '',
    signatureDate2: '',
    signature2: '' // This will now store the signature data URL
  })

  const [scale, setScale] = useState(0.8) // Initial scale set to 80% to fit most screens
  const [activeField, setActiveField] = useState(null)
  const formRef = useRef(null)
  const inputRefs = useRef({})

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCharChange = (field, index, value) => {
    const newChars = [...formData[field]]
    newChars[index] = value
    setFormData(prev => ({
      ...prev,
      [field]: newChars
    }))

    // Auto-tab to next character field (left-to-right)
    if (value && index < newChars.length - 1) {
      const nextField = `${field}-${index + 1}`
      if (inputRefs.current[nextField]) {
        inputRefs.current[nextField].focus()
      }
    }
  }

  const fieldOrder = [
    'name', 
    'idChars-0', 'idChars-1', 'idChars-2', 'idChars-3', 'idChars-4', 
    'idChars-5', 'idChars-6', 'idChars-7', 'idChars-8', // 9 ID chars
    'address', 'agentName', 'licenseNumber', 'checkbox1', 'checkbox2', 'checkbox3',
    'phone', 'email', 'signatureDate1', 'signature1',
    'recipient', 'nameB', 
    'idCharsB-0', 'idCharsB-1', 'idCharsB-2', 'idCharsB-3', 'idCharsB-4',
    'idCharsB-5', 'idCharsB-6', 'idCharsB-7', 'idCharsB-8', // 9 ID chars
    'tableField1', 'tableField2', 'signatureDate2', 'signature2'
  ]

  const focusNextField = (currentField) => {
    const currentIndex = fieldOrder.indexOf(currentField)
    if (currentIndex !== -1 && currentIndex < fieldOrder.length - 1) {
      const nextField = fieldOrder[currentIndex + 1]
      if (inputRefs.current[nextField]) {
        inputRefs.current[nextField].focus()
      }
    }
  }

  const handleKeyDown = (e, fieldName) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      focusNextField(fieldName)
    }
  }

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5))
  }

  const generatePDF = () => {
    const printWindow = window.open('', '_blank')
    let formHTML = formRef.current.innerHTML
    
    // Replace signature pads with signature images for PDF
    if (formData.signature1) {
      formHTML = formHTML.replace(
        /<div class="signature-pad-container">[\s\S]*?<\/div>/,
        `<div style="text-align: center;"><div style="font-size: 12px; margin-bottom: 8px;">חתימת הלקוח</div><img src="${formData.signature1}" style="border: 1px solid #ccc; width: 160px; height: 60px;" /></div>`
      )
    }
    
    if (formData.signature2) {
      formHTML = formHTML.replace(
        /<div class="signature-pad-container">[\s\S]*?<\/div>/,
        `<div style="text-align: center;"><div style="font-size: 12px; margin-bottom: 8px;">חתימת הלקוח</div><img src="${formData.signature2}" style="border: 1px solid #ccc; width: 160px; height: 60px;" /></div>`
      )
    }
    
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>Hebrew Form</title>
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; }
            .hebrew-form { max-width: 800px; margin: 0 auto; }
            /* Adjust ID char box size for PDF */
            .id-char-box { width: 18px; height: 24px; margin-left: 2px; margin-right: 2px; }
            /* Hide signature pad controls in PDF */
            .signature-pad-container button { display: none !important; }
          </style>
        </head>
        <body>
          <div class="hebrew-form">${formHTML}</div>
          <script>window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const sendFormByEmail = () => {
    // Prepare email data
    const serviceType = [
      formData.checkbox1 ? "יועץ פנסיוני" : "",
      formData.checkbox2 ? "סוכן ביטוח פנסיוני" : "",
      formData.checkbox3 ? "סוכן שיווק פנסיוני" : ""
    ].filter(Boolean).join(", ")

    const emailSubject = `טופס הרשאה חד פעמית - ${formData.name || "ללא שם"}`
    
    const emailBody = `שלום,

התקבל טופס הרשאה חד פעמית חדש:

פרטי הלקוח:
- שם: ${formData.name || "לא צוין"}
- מספר זיהוי: ${formData.idChars.join('') || "לא צוין"}
- כתובת: ${formData.address || "לא צוין"}
- טלפון: ${formData.phone || "לא צוין"}
- דוא"ל: ${formData.email || "לא צוין"}

פרטי הסוכן/יועץ:
- שם: ${formData.agentName || "לא צוין"}
- מספר רישיון: ${formData.licenseNumber || "לא צוין"}
- סוג שירות: ${serviceType || "לא צוין"}

פרטי נוספים (נספח):
- נמען: ${formData.recipient || "לא צוין"}
- שם בנספח: ${formData.nameB || "לא צוין"}
- מספר זיהוי בנספח: ${formData.idCharsB.join('') || "לא צוין"}
- שדה טבלה 1: ${formData.tableField1 || "לא צוין"}
- שדה טבלה 2: ${formData.tableField2 || "לא צוין"}

תאריכי חתימה:
- תאריך חתימה 1: ${formData.signatureDate1 || "לא צוין"}
- תאריך חתימה 2: ${formData.signatureDate2 || "לא צוין"}

תאריך שליחה: ${new Date().toLocaleDateString('he-IL')}

📎 הערה חשובה: אנא הורד את הטופס המלא עם החתימות הדיגיטליות באמצעות כפתור "הורד טופס מלא" באתר, וצרף את קובץ ה-PDF לדוא"ל זה לפני השליחה.

בברכה,
מערכת הטפסים הדיגיטליים`

    // Create mailto link
    const mailtoLink = `mailto:arsan@future-ins.co.il?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    
    // Show message and open email
    alert("📧 פותח תוכנת דוא\"ל עם פרטי הטופס.\n💡 אל תשכח להוריד את הטופס עם החתימות ולצרף אותו לדוא\"ל!")
    
    // Open email client
    window.location.href = mailtoLink
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8" dir="rtl">
      {/* Instructions Banner */}
      <div className="max-w-4xl mx-auto mb-6 px-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-bold text-blue-800 mb-2 text-center">
            📋 הוראות מילוי ושליחת הטופס
          </h2>
          <div className="text-blue-700 text-sm space-y-1">
            <p><strong>שלב 1:</strong> מלא את כל השדות בטופס וחתום בשני מקומות החתימה הדיגיטליים</p>
            <p><strong>שלב 2:</strong> לחץ על כפתור <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">"הורד טופס מלא"</span> להורדת הטופס עם החתימות</p>
            <p><strong>שלב 3:</strong> לחץ על כפתור <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">"שלח בדוא"ל"</span> לפתיחת תוכנת הדוא"ל</p>
            <p><strong>שלב 4:</strong> צרף את קובץ ה-PDF שהורדת לדוא"ל ושלח ל-arsan@future-ins.co.il</p>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4">
        {/* Active field indicator */}
        {activeField && (
          <div className="fixed top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded text-sm z-10">
            עורך: {activeField}
          </div>
        )}

        {/* Zoom controls */}
        <div className="flex justify-center gap-4 mb-6">
          <Button onClick={zoomOut} variant="outline" size="sm">
            <ZoomOut className="w-4 h-4 ml-1" />
            הקטן
          </Button>
          <span className="flex items-center px-3 py-1 bg-white rounded border">
            {Math.round(scale * 100)}%
          </span>
          <Button onClick={zoomIn} variant="outline" size="sm">
            <ZoomIn className="w-4 h-4 ml-1" />
            הגדל
          </Button>
        </div>

        <div className="flex justify-center">
          <div 
            ref={formRef}
            className="bg-white shadow-lg p-8 hebrew-form"
            style={{ 
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              width: '800px',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            {/* Accessibility Symbol */}
            <div className="flex justify-start mb-4">
              <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center rounded">
                ♿
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-xs text-gray-600 mb-2">כבד מאן דבעי,</div>
              <h1 className="text-lg font-bold mb-4">
                הרשאה חד פעמית לסוכן / יועץ פנסיוני לקבלת מידע (נספח א)
              </h1>
            </div>

            {/* Form Section 1 */}
            <div className="mb-6">
              <div className="text-sm font-bold mb-3">מייפה הכוח (הלקוח):</div>
              
              {/* Name field - single line, on its own line */}
              <div className="flex items-center mb-3">
                <span className="text-sm ml-4">שם:</span>
                <div className="flex-1 border-b border-gray-400 mx-4">
                  <input
                    ref={el => inputRefs.current['name'] = el}
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    onFocus={() => setActiveField('name')}
                    onBlur={() => setActiveField(null)}
                    onKeyDown={(e) => handleKeyDown(e, 'name')}
                    className="w-full bg-transparent border-none text-sm focus:outline-none hebrew-text"
                  />
                </div>
              </div>

              {/* ID Number field - now on a separate line */}
              <div className="flex items-center mb-3">
                <span className="text-sm ml-4">מספר זיהוי:</span>
                <div className="id-container flex gap-0.5" dir="ltr">
                  {Array.from({ length: 9 }, (_, i) => (
                    <input
                      key={i}
                      ref={el => inputRefs.current[`idChars-${i}`] = el}
                      type="text"
                      maxLength="1"
                      value={formData.idChars[i]}
                      onChange={(e) => handleCharChange('idChars', i, e.target.value)}
                      onFocus={() => setActiveField(`idChars-${i}`)}
                      onBlur={() => setActiveField(null)}
                      onKeyDown={(e) => handleKeyDown(e, `idChars-${i}`)}
                      className="w-5 h-7 border border-gray-400 text-center text-sm focus:border-blue-500 focus:outline-none id-char-box" dir="ltr"
                    />
                  ))}
                </div>
              </div>

              {/* Address field */}
              <div className="flex items-center mb-3">
                <span className="text-sm ml-4">כתובת:</span>
                <div className="flex-1 border-b border-gray-400 mx-4">
                  <input
                    ref={el => inputRefs.current['address'] = el}
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    onFocus={() => setActiveField('address')}
                    onBlur={() => setActiveField(null)}
                    onKeyDown={(e) => handleKeyDown(e, 'address')}
                    className="w-full bg-transparent border-none text-sm focus:outline-none hebrew-text"
                  />
                </div>
              </div>
            </div>

            {/* Form Section 2 */}
            <div className="mb-6">
              <div className="text-sm font-bold mb-3">
                מיופה הכוח (סוכן/ יועץ פנסיוני, במקרה של סוכן / יועץ פנסיוני שהוא תאגיד מיופה הכוח הינו התאגיד):
              </div>
              
              {/* Agent Name field - single line */}
              <div className="flex items-center mb-3">
                <span className="text-sm ml-4">שם (יחיד / תאגיד):</span>
                <div className="flex-1 border-b border-gray-400 mx-4">
                  <input
                    ref={el => inputRefs.current['agentName'] = el}
                    type="text"
                    value={formData.agentName}
                    onChange={(e) => handleInputChange('agentName', e.target.value)}
                    onFocus={() => setActiveField('agentName')}
                    onBlur={() => setActiveField(null)}
                    onKeyDown={(e) => handleKeyDown(e, 'agentName')}
                    className="w-full bg-transparent border-none text-sm focus:outline-none hebrew-text"
                  />
                </div>
                <span className="text-sm mr-4">רישיון מס':</span>
                <div className="w-32 border-b border-gray-400">
                  <input
                    ref={el => inputRefs.current['licenseNumber'] = el}
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    onFocus={() => setActiveField('licenseNumber')}
                    onBlur={() => setActiveField(null)}
                    onKeyDown={(e) => handleKeyDown(e, 'licenseNumber')}
                    className="w-full bg-transparent border-none text-sm focus:outline-none hebrew-text"
                  />
                </div>
              </div>

              {/* Service type checkboxes */}
              <div className="mb-3">
                <div className="text-sm mb-2">אשר הינו:</div>
                <div className="flex flex-col gap-2 mr-4">
                  <label className="flex items-center">
                    <input
                      ref={el => inputRefs.current['checkbox1'] = el}
                      type="checkbox"
                      checked={formData.checkbox1}
                      onChange={(e) => handleInputChange('checkbox1', e.target.checked)}
                      onFocus={() => setActiveField('checkbox1')}
                      onBlur={() => setActiveField(null)}
                      onKeyDown={(e) => handleKeyDown(e, 'checkbox1')}
                      className="ml-2"
                    />
                    <span className="text-sm">(1) יועץ פנסיוני</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      ref={el => inputRefs.current['checkbox2'] = el}
                      type="checkbox"
                      checked={formData.checkbox2}
                      onChange={(e) => handleInputChange('checkbox2', e.target.checked)}
                      onFocus={() => setActiveField('checkbox2')}
                      onBlur={() => setActiveField(null)}
                      onKeyDown={(e) => handleKeyDown(e, 'checkbox2')}
                      className="ml-2"
                    />
                    <span className="text-sm">(2) סוכן ביטוח פנסיוני</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      ref={el => inputRefs.current['checkbox3'] = el}
                      type="checkbox"
                      checked={formData.checkbox3}
                      onChange={(e) => handleInputChange('checkbox3', e.target.checked)}
                      onFocus={() => setActiveField('checkbox3')}
                      onBlur={() => setActiveField(null)}
                      onKeyDown={(e) => handleKeyDown(e, 'checkbox3')}
                      className="ml-2"
                    />
                    <span className="text-sm">(3) סוכן שיווק פנסיוני</span>
                  </label>
                </div>
                <div className="text-xs text-gray-600 mt-2">סמן את האפשרויות המתאימה.</div>
              </div>

              {/* Contact fields */}
              <div className="flex items-center mb-3">
                <span className="text-sm ml-4">טלפון:</span>
                <div className="w-32 border-b border-gray-400 mx-4">
                  <input
                    ref={el => inputRefs.current['phone'] = el}
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    onFocus={() => setActiveField('phone')}
                    onBlur={() => setActiveField(null)}
                    onKeyDown={(e) => handleKeyDown(e, 'phone')}
                    className="w-full bg-transparent border-none text-sm focus:outline-none hebrew-text"
                  />
                </div>
                <span className="text-sm mr-4">דוא"ל:</span>
                <div className="w-48 border-b border-gray-400">
                  <input
                    ref={el => inputRefs.current['email'] = el}
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onFocus={() => setActiveField('email')}
                    onBlur={() => setActiveField(null)}
                    onKeyDown={(e) => handleKeyDown(e, 'email')}
                    className="w-full bg-transparent border-none text-sm focus:outline-none hebrew-text"
                  />
                </div>
              </div>
            </div>

            {/* Authorization text */}
            <div className="mb-6 text-sm leading-relaxed">
              <p className="mb-4">
                אני, הח"מ, מייפה את כוחו של הסוכן / היועץ הפנסיוני, או מי מטעמו, לפנות בשמי לכל גוף מוסדי לשם קבלת מידע אודות מוצרים פנסיוניים ותכניות ביטוח לצמי מתן ייעוץ פנסיוני או שיווק פנסיוני באופן חד-פעמי או לצמי מתן ייעוץ פנסיוני או שיווק פנסיוני לראשונה, כהכנה למתן ייעוץ פנסיוני או שיווק פנסיוני מתמשך. העברת מידע אודותיי, כאמור לעיל, יכול שתעשה באמצעות מערכת סליקה פנסיונית. ייפוי כוח זה מתייחס לכל המוצרים הפנסיוניים המנוהלים עבורי בגוף מוסדי כלשהו נכון למועד חתימת הרשאה זו, מלבד המוצרים המנויים בטופס המצורף להרשאה זו (עבור כל גוף מוסדי בנפרד).
              </p>
              <p className="mb-4 font-bold">
                שים לב! אם לא יצוינו מוצרים פנסיוניים בטופס המצ"ב, ההרשאה תתייחס לכל המוצרים הפנסיוניים ותכניות הביטוח שברשותך.
              </p>
              <p className="mb-4">
                הרשאה זו תעמוד בתוקפה במשך 3 חודשים מיום חתימתה ולראיה באתי על החתום:
              </p>
            </div>

            {/* Signature section */}
            <div className="flex justify-between mb-8">
              <div className="text-center">
                <div className="text-sm mb-2">תאריך החתימה</div>
                <div className="w-32 border-b border-gray-400">
                  <input
                    ref={el => inputRefs.current['signatureDate1'] = el}
                    type="text"
                    value={formData.signatureDate1}
                    onChange={(e) => handleInputChange('signatureDate1', e.target.value)}
                    onFocus={() => setActiveField('signatureDate1')}
                    onBlur={() => setActiveField(null)}
                    onKeyDown={(e) => handleKeyDown(e, 'signatureDate1')}
                    className="w-full bg-transparent border-none text-sm text-center focus:outline-none"
                  />
                </div>
              </div>
              <div className="text-center">
                <SignaturePad
                  value={formData.signature1}
                  onChange={(dataURL) => handleInputChange('signature1', dataURL)}
                  width={160}
                  height={60}
                  label="חתימת הלקוח"
                />
              </div>
            </div>

            {/* Footnotes */}
            <div className="text-xs leading-relaxed mb-8">
              <p className="mb-2">
                <sup>1</sup> מי מטעמו - עובד הקשור לעבודתו של בעל הרישיון הפונה בשמו של גוף מוסדי מיופה כאמור באמצעות מערכת סליקה פנסיונית מרכזית הפועלת בפיקוח על שירותים פיננסיים (ייעוץ ושיווק פנסיוני) (אבחנות ושירותים במערכת סליקה פנסיונית ומרכזית), התשע"ב-2012.
              </p>
              <p className="mb-2">
                <sup>2</sup> גוף מוסדי - כל אחד מאלה: חברת ביטוח או חברה מנהלת ו/או קופת גמל, או קרן השתלמות או קרן פנסיה.
              </p>
              <p className="mb-2">
                <sup>3</sup> מידע - לדוגמה: פרטי הגוף המוסדי המנהל את המוצר, סוג המוצר הפנסיוני, פרטי המבוטח, פרטי המוטב, פרטי חשבון, הפקדות ויתרות כספיות, נתוני מסלולים, נתוני ידע של קיים וצרכים, נתוני פאקטורים ועיקונים, הגדרות וכו'.
              </p>
              <p className="mb-2">
                <sup>4</sup> מוצר פנסיוני - מוצר פנסיוני כהגדרתו בסעיף 1 לחוק ייעוץ פנסיוני וכו' ביטוח וכו' (מוצר פנסיוני כהגדרתו בסעיף 31(א)(2) לחוק ייעוץ פנסיוני).
              </p>
              <p className="mb-2">
                <sup>5</sup> תכנית ביטוח - תכנית ביטוח מכל סוגי סיכון (לרבות אובדן כושר עבודה).
              </p>
            </div>

            <hr className="border-gray-400 mb-8" />

            {/* Appendix Form */}
            <div className="mb-6">
              <h2 className="text-center text-lg font-bold mb-6">
                נספח להרשאה חד פעמית לסוכן / יועץ פנסיוני לקבלת מידע (רשות)
              </h2>
              
              <div className="mb-4">
                <div className="text-sm mb-2">לכבוד:</div>
                <div className="border-b border-gray-400 mb-2">
                  <input
                    ref={el => inputRefs.current['recipient'] = el}
                    type="text"
                    value={formData.recipient}
                    onChange={(e) => handleInputChange('recipient', e.target.value)}
                    onFocus={() => setActiveField('recipient')}
                    onBlur={() => setActiveField(null)}
                    onKeyDown={(e) => handleKeyDown(e, 'recipient')}
                    className="w-full bg-transparent border-none text-sm focus:outline-none hebrew-text"
                  />
                </div>
                <div className="text-xs text-gray-600">(שם הגוף המוסדי), (מספר ח.פ)</div>
              </div>

              <div className="text-center text-sm font-bold mb-4">
                הנדון: רשימת מוצרים פנסיוניים ותכניות ביטוח מוחרגים
              </div>

              <div className="flex items-center mb-4">
                <span className="text-sm ml-4">שם:</span>
                <div className="flex-1 border-b border-gray-400 mx-4">
                  <input
                    ref={el => inputRefs.current['nameB'] = el}
                    type="text"
                    value={formData.nameB}
                    onChange={(e) => handleInputChange('nameB', e.target.value)}
                    onFocus={() => setActiveField('nameB')}
                    onBlur={() => setActiveField(null)}
                    onKeyDown={(e) => handleKeyDown(e, 'nameB')}
                    className="w-full bg-transparent border-none text-sm focus:outline-none hebrew-text"
                  />
                </div>
                <span className="text-sm mr-4">מספר זיהוי:</span>
                <div className="id-container flex gap-0.5" dir="ltr">
                  {Array.from({ length: 9 }, (_, i) => (
                    <input
                      key={i}
                      ref={el => inputRefs.current[`idCharsB-${i}`] = el}
                      type="text"
                      maxLength="1"
                      value={formData.idCharsB[i]}
                      onChange={(e) => handleCharChange('idCharsB', i, e.target.value)}
                      onFocus={() => setActiveField(`idCharsB-${i}`)}
                      onBlur={() => setActiveField(null)}
                      onKeyDown={(e) => handleKeyDown(e, `idCharsB-${i}`)}
                      className="w-5 h-7 border border-gray-400 text-center text-sm focus:border-blue-500 focus:outline-none id-char-box" dir="ltr"
                    />
                  ))}
                </div>
              </div>

              <div className="text-sm mb-4">
                להלן פירוט המוצרים הפנסיוניים ומוצרי הביטוח המוחרגים מייפוי הכוח:
              </div>

              {/* Table */}
              <div className="border border-gray-400 mb-4">
                <div className="flex">
                  <div className="flex-1 border-l border-gray-400 p-2 text-center text-sm font-bold bg-red-50">
                    (1) מספר חשבון הלקוח במוצר
                  </div>
                  <div className="flex-1 p-2 text-center text-sm font-bold bg-green-50">
                    (2) מספר הקידוד של המוצר (רשות)
                  </div>
                </div>
                <div className="flex" style={{ minHeight: '120px' }}>
                  <div className="flex-1 border-l border-gray-400 p-2">
                    <textarea
                      ref={el => inputRefs.current['tableField1'] = el}
                      value={formData.tableField1}
                      onChange={(e) => handleInputChange('tableField1', e.target.value)}
                      onFocus={() => setActiveField('tableField1')}
                      onBlur={() => setActiveField(null)}
                      onKeyDown={(e) => handleKeyDown(e, 'tableField1')}
                      className="w-full h-full bg-transparent border-none text-sm resize-none focus:outline-none"
                    />
                  </div>
                  <div className="flex-1 p-2">
                    <textarea
                      ref={el => inputRefs.current['tableField2'] = el}
                      value={formData.tableField2}
                      onChange={(e) => handleInputChange('tableField2', e.target.value)}
                      onFocus={() => setActiveField('tableField2')}
                      onBlur={() => setActiveField(null)}
                      onKeyDown={(e) => handleKeyDown(e, 'tableField2')}
                      className="w-full h-full bg-transparent border-none text-sm resize-none focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="text-xs mb-4">
                <p className="mb-2">* החרגה על מוצר פנסיוני תתייחס לכל מסלולי ההשקעה והכיסויים הביטוחיים הכלולים בו.</p>
                <p className="mb-2">* אם מועבר "מספר הקידוד של המוצר" יש להעבירו בהתאם להוראות חוזר "מבנה אחיד להעברת מידע ונתונים בשוק החיסכון הפנסיוני".</p>
              </div>

              <div className="text-sm mb-4">ולראיה באתי על החתום:</div>

              {/* Signature section B */}
              <div className="flex justify-between mb-4">
                <div className="text-center">
                  <div className="text-sm mb-2">תאריך החתימה</div>
                  <div className="w-32 border-b border-gray-400">
                    <input
                      ref={el => inputRefs.current['signatureDate2'] = el}
                      type="text"
                      value={formData.signatureDate2}
                      onChange={(e) => handleInputChange('signatureDate2', e.target.value)}
                      onFocus={() => setActiveField('signatureDate2')}
                      onBlur={() => setActiveField(null)}
                      onKeyDown={(e) => handleKeyDown(e, 'signatureDate2')}
                      className="w-full bg-transparent border-none text-sm text-center focus:outline-none"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <SignaturePad
                    value={formData.signature2}
                    onChange={(dataURL) => handleInputChange('signature2', dataURL)}
                    width={160}
                    height={60}
                    label="חתימת הלקוח"
                  />
                </div>
              </div>

              <div className="text-xs">
                נספח זה יועבר לכל גוף מוסדי אליו פונה הסוכן/ היועץ הפנסיוני. אם הלקוח לא ביקש להחריג מייפוי הכוח מוצר פנסיוני או מוצר ביטוח בגוף מוסדי, <br />
                ישלח הנספח לאותו גוף מוסדי כשהוא ריק.
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button onClick={generatePDF} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 ml-2" />
            הורד טופס מלא
          </Button>
          <Button onClick={sendFormByEmail} className="bg-green-600 hover:bg-green-700">
            <Send className="w-4 h-4 ml-2" />
            שלח בדוא"ל
          </Button>
        </div>
      </div>
    </div>
  )
}

export default App


