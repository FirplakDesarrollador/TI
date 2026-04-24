import { jsPDF } from 'jspdf'

interface AssignmentData {
  employeeName: string
  employeeId: string
  employeeCargo: string
  employeeArea: string
  deviceName: string
  deviceSerial: string
  deviceCategory: string
  deviceObservation: string
  assignmentDate: string
  notes: string
  signature: string
}

// Utility to format date in Spanish: "27 de enero de 2026"
const formatDateSpanish = (dateStr: string) => {
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ]
  const date = new Date(dateStr + 'T12:00:00')
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day} de ${month} de ${year}`
}

async function getImageFromUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.setAttribute('crossOrigin', 'anonymous')
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0)
      const dataURL = canvas.toDataURL('image/png')
      resolve(dataURL)
    }
    img.onerror = (err) => reject(err)
    img.src = url
  })
}

export const generateAssignmentPDF = async (data: AssignmentData) => {
  const doc = new jsPDF()
  const margin = 25
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Logic to detect if it's a computer/main device for title purposes:
  const computerTerms = [
    'computador', 'laptop', 'portatil', 'portátil', 'pc', 'desktop', 
    'workstation', 'servidor', 'server', 'all in one', 'aio', 
    'tablet', 'ipad', 'celular', 'teléfono', 'telefono', 
    'smartphone', 'iphone', 'galaxy', 'unidad'
  ]
  const isComputador = computerTerms.some(term => 
    (data.deviceName || '').toLowerCase().includes(term) || 
    (data.deviceCategory || '').toLowerCase().includes(term)
  )
                       
  const fechaLarga = formatDateSpanish(data.assignmentDate)
  
  let logoBase64 = ''
  try {
    logoBase64 = await getImageFromUrl('https://jdtjtkncptwqdhlxmzds.supabase.co/storage/v1/object/public/publico/assets/Logo-Firplak.png')
  } catch (e) {
    console.error('Error loading logo', e)
  }

  // -------------------- PÁGINA 1: Acta de Entrega --------------------
  
  // Header
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', margin, 15, 45, 20)
  }
  
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.text('Firplak S.A', pageWidth - margin, 20, { align: 'right' })
  doc.text(`Fecha de entrega: ${fechaLarga}`, pageWidth - margin, 26, { align: 'right' })

  // Título
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  const titulo = `ACTA DE ENTREGA EQUIPO ${isComputador ? 'COMPUTADOR' : 'PERIFÉRICO'}`
  doc.text(titulo, pageWidth / 2, 50, { align: 'center' })

  // Intro
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const intro = `A continuación, se relaciona la entrega de equipo ${isComputador ? 'Computador' : 'periférico'}.`
  doc.text(intro, margin, 65)

  // Fields
  let y = 85
  doc.setFont('helvetica', 'bold')
  doc.text('Modelo: ', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`1- ${data.deviceName}`, margin + 18, y)
  
  y += 15
  doc.setFont('helvetica', 'bold')
  doc.text('Observaciones de salvedad:', margin, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  const obsSalvedad = doc.splitTextToSize(data.notes || 'Ninguna.', pageWidth - (margin * 2))
  doc.text(obsSalvedad, margin, y)

  y += 30
  doc.setFont('helvetica', 'bold')
  doc.text('S/N: ', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.deviceSerial, margin + 11, y)

  y = 230
  doc.setFont('helvetica', 'bold')
  doc.text('Entregado a: ', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.employeeName, margin + 25, y)

  y += 10
  if (data.signature) {
    try {
      doc.addImage(data.signature, 'PNG', margin, y, 40, 20)
      y += 20
    } catch (e) {
      y += 20
    }
  } else {
    y += 20
  }
  
  doc.setFontSize(11)
  doc.text('Firma empleado', margin + 20, y + 5, { align: 'center' })

  // Footer Pág 1
  const footerY = doc.internal.pageSize.getHeight() - 25
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text([
    'Dirección: Calle 29 No. 41-15 Itagüí - Antioquia - Colombia',
    'Conmutador: (604) 444 17 71',
    'Página Web: www.firplak.com',
    'Correo electrónico: notificacion.fidelidad@firplak.com'
  ], pageWidth / 2, footerY, { align: 'center' })

  // -------------------- PÁGINA 2: Autorización --------------------
  
  // Always add page 2 as requested
  if (true) {
    doc.addPage()
    doc.setTextColor(0, 0, 0)
    
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin, 15, 45, 20)
    }
    
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Itagüí, ${fechaLarga}`, pageWidth - margin, 20, { align: 'right' })

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('ESTA COPIA HACE PARTE INTEGRAL DEL PRESENTE CONTRATO', pageWidth / 2, 45, { align: 'center' })
    
    doc.setFontSize(13)
    doc.text('AUTORIZACIÓN PARA DEDUCCIÓN POR EQUIPOS DE CÓMPUTO', pageWidth / 2, 55, { align: 'center' })
    doc.text('DAÑADOS O PÉRDIDAS', pageWidth / 2, 62, { align: 'center' })

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    let currentY = 75
    
    // Main Paragraph with lines/underlines
    const textStart = 'Atendiendo a lo estipulado en los '
    const textBold = 'Arts. 28, 58, 62, 149 del Código Sustantivo del Trabajo;'
    doc.text(textStart, margin, currentY)
    let textWidth = doc.getTextWidth(textStart)
    doc.setFont('helvetica', 'bold')
    doc.text(textBold, margin + textWidth, currentY)
    
    currentY += 6
    doc.setFont('helvetica', 'normal')
    doc.text('entre FIRPLAK SA y ', margin, currentY)
    textWidth = doc.getTextWidth('entre FIRPLAK SA y ')
    
    const empName = data.employeeName || '____________________________________'
    doc.text(empName, margin + textWidth + 2, currentY)
    const empWidth = doc.getTextWidth(empName)
    doc.line(margin + textWidth, currentY + 1, margin + textWidth + empWidth + 4, currentY + 1)
    
    currentY += 6
    doc.text('han acordado que en virtud de su cargo como ', margin, currentY)
    textWidth = doc.getTextWidth('han acordado que en virtud de su cargo como ')
    const cargo = data.employeeCargo || '___________________________'
    doc.text(cargo, margin + textWidth + 2, currentY)
    const cargoWidth = doc.getTextWidth(cargo)
    doc.line(margin + textWidth, currentY + 1, margin + textWidth + cargoWidth + 4, currentY + 1)
    
    currentY += 6
    const textFinal = 'en FIRPLAK S.A.; tiene asignado un Equipo de Cómputo como parte de su equipo de trabajo, el cual es necesario para el desempeño eficiente de sus labores.'
    const splitFinal = doc.splitTextToSize(textFinal, pageWidth - (margin * 2))
    doc.text(splitFinal, margin, currentY)
    
    currentY += (splitFinal.length * 6) + 5

    const sections = [
      { t: 'RESPONSABILIDAD DEL TRABAJADOR:', c: 'El trabajador será responsable de la custodia, cuidado y mantenimiento adecuado a través del Área de TI, del Equipo de Cómputo asignado para el desempeño de sus funciones.' },
      { t: 'REPORTE DE DAÑOS O PÉRDIDAS:', c: 'En caso de daño/avería o pérdida del Equipo de Cómputo asignado, el trabajador deberá informar de inmediato al Área de TI dentro de la empresa.' },
      { t: 'PROCESO DE DEDUCCIÓN DE NÓMINA:', c: 'Previo agotamiento del respectivo Procedimiento Disciplinario; en caso de daño irreparable o pérdida del Equipo de Cómputo asignado debido a negligencia o incumplimiento de su deber de custodia, cuidado y responsabilidad con respecto al Equipo de Cómputo asignado, FIRPLAK S.A procederá con el colaborador que ejercía custodia del equipo perdido o averiado; a suscribir la presente autorización para ejecutar la respectiva deducción del costo del equipo dañado o perdido de la nómina del trabajador, de acuerdo con el valor indexado de reposición de este.' },
      { t: 'ACUERDO DE CONSENTIMIENTO:', c: 'El trabajador reconoce y acepta que, en caso de incumplimiento de su deber de custodia, cuidado y responsabilidad con respecto al Equipo de Cómputo asignado, FIRPLAK S.A tiene el derecho de deducir el costo correspondiente de la Nómina y de la Liquidación Laboral del trabajador sin previa autorización adicional.' }
    ]

    sections.forEach(s => {
      doc.setFont('helvetica', 'bold')
      doc.text(s.t, margin, currentY)
      currentY += 6
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(s.c, pageWidth - (margin * 2))
      doc.text(lines, margin, currentY)
      currentY += (lines.length * 6) + 4
    })

    currentY = 250 // Signatures vertical position
    const colWidth = (pageWidth - (margin * 3)) / 2
    
    // Firplak side
    doc.setDrawColor(0)
    doc.line(margin, currentY, margin + colWidth, currentY)
    doc.setFontSize(10)
    doc.text('FIRPLAK S.A', margin + (colWidth / 2), currentY + 5, { align: 'center' })
    doc.text('Ismael Correa Restrepo', margin + (colWidth / 2), currentY + 10, { align: 'center' })
    doc.text('NIT: 890.927.404', margin + (colWidth / 2), currentY + 15, { align: 'center' })

    // Employee side
    if (data.signature) {
      doc.addImage(data.signature, 'PNG', margin + colWidth + margin + (colWidth / 2) - 20, currentY - 22, 40, 20)
    }
    doc.line(margin + colWidth + margin, currentY, pageWidth - margin, currentY)
    doc.text(`Nombre: ${data.employeeName}`, margin + colWidth + margin + (colWidth / 2), currentY + 5, { align: 'center' })
    doc.text(`Cargo: ${data.employeeCargo}`, margin + colWidth + margin + (colWidth / 2), currentY + 10, { align: 'center' })
    doc.text(`C.C.: ${data.employeeId}`, margin + colWidth + margin + (colWidth / 2), currentY + 15, { align: 'center' })
  }

  // Return the PDF as Uint8Array for storage/upload
  return doc.output('arraybuffer')
}
