import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { FiDownload, FiPrinter, FiCopy } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useLanguage } from '../../context/LanguageContext'

const QRCodeCard = ({ table }) => {
  const { t } = useLanguage()
  const qrRef = useRef(null)

  const frontendUrl = window.location.origin
  const tableUrl = `${frontendUrl}/menu?table=${table.id}`

  // Download QR Code as high-res PNG
  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return

    const imageUri = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = imageUri
    link.download = `Table-${table.table_number}-QR.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success(`${t('downloadQrCode')} — ${t('tableNumber', { number: table.table_number })}`)
  }

  // Print table standee
  const handlePrint = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    if (!canvas) return

    const imageUri = canvas.toDataURL('image/png')
    const printWindow = window.open('', '_blank')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Table ${table.table_number} — QR Code</title>
          <link rel="stylesheet" href="https://cdn-uicons.flaticon.com/2.6.0/uicons-solid-rounded/css/uicons-solid-rounded.css" />
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              margin: 0;
              color: #1e293b;
            }
            .card {
              border: 3px solid #f97316;
              border-radius: 24px;
              padding: 40px;
              text-align: center;
              max-width: 340px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            }
            .brand {
              font-size: 16px;
              font-weight: 800;
              color: #ea580c;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 8px;
            }
            .title {
              font-size: 32px;
              font-weight: 900;
              margin: 0 0 6px;
            }
            .subtitle {
              font-size: 14px;
              color: #64748b;
              margin: 0 0 24px;
            }
            img {
              border-radius: 16px;
              padding: 12px;
              background: #fff;
              border: 1px solid #e2e8f0;
            }
            .instructions {
              font-size: 13px;
              font-weight: 700;
              margin-top: 24px;
              color: #0f172a;
              background: #fff7ed;
              padding: 10px 16px;
              border-radius: 999px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">SreyKeo Coffee & Soup</div>
            <h1 class="title">Table ${table.table_number}</h1>
            <p class="subtitle">${table.name || 'Dine-In Area'}</p>
            <img src="${imageUri}" width="220" height="220" />
            <div class="instructions"><i class="fi fi-sr-smartphone" style="vertical-align:middle;margin-right:6px"></i>${t('scanToOrderInstructions')}</div>
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(tableUrl)
    toast.success(t('tableUrlCopied'))
  }

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col items-center text-center space-y-4">
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {t('tableStandee')}
        </span>
        <span
          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
            table.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {table.status === 'active' ? t('statusActive') : t('statusInactive')}
        </span>
      </div>

      <div>
        <h3 className="text-lg font-black text-slate-900">{t('tableNumber', { number: table.table_number })}</h3>
        <p className="text-xs text-slate-500">{table.name || t('dineInArea')}</p>
      </div>

      {/* QR Canvas */}
      <div
        ref={qrRef}
        className="p-3.5 bg-white rounded-2xl border-2 border-orange-100 shadow-inner flex items-center justify-center"
      >
        <QRCodeCanvas
          value={tableUrl}
          size={160}
          level="H"
          marginSize={2}
          fgColor="#0f172a"
        />
      </div>

      <p className="text-[11px] text-slate-400 max-w-xs truncate font-mono">
        {tableUrl}
      </p>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 w-full pt-1">
        <button
          type="button"
          onClick={handleDownload}
          className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200 hover:border-orange-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          title={t('downloadQrCode')}
        >
          <FiDownload className="w-4 h-4" />
          <span className="text-[10px] font-bold truncate w-full px-1">{t('downloadQrCode').split(' ')[0]}</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-xs text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          title={t('printStandee')}
        >
          <FiPrinter className="w-4 h-4" />
          <span className="text-[10px] font-bold truncate w-full px-1">{t('printStandee').split(' ')[0]}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyUrl}
          className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-50 hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200 hover:border-orange-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          title={t('copyTableLink')}
        >
          <FiCopy className="w-4 h-4" />
          <span className="text-[10px] font-bold truncate w-full px-1">{t('copyTableLink').split(' ')[0]}</span>
        </button>
      </div>
    </div>
  )
}

export default QRCodeCard
