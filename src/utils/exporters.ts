
interface Entity {
  id: string;
  [key: string]: any;
}

export function exportToJson<T extends Entity>(data: T[], filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadFile(blob, `${filename}.json`);
}

export function exportToXml<T extends Entity>(data: T[], filename: string): void {
  // Create XML structure
  let xmlContent = '<?xml version="1.0" encoding="UTF-8" ?>\n';
  xmlContent += `<${filename}>\n`;
  
  // Add each item as XML element
  data.forEach((item) => {
    const entityType = filename.endsWith('s') ? filename.slice(0, -1) : filename;
    xmlContent += `  <${entityType} id="${item.id}">\n`;
    
    // Add all properties of the item
    Object.entries(item).forEach(([key, value]) => {
      if (key !== 'id') {
        // Skip null or undefined values
        if (value !== null && value !== undefined) {
          // Handle nested objects
          if (typeof value === 'object' && !Array.isArray(value)) {
            xmlContent += `    <${key}>\n`;
            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
              xmlContent += `      <${nestedKey}>${escapeXml(String(nestedValue))}</${nestedKey}>\n`;
            });
            xmlContent += `    </${key}>\n`;
          } 
          // Handle arrays
          else if (Array.isArray(value)) {
            xmlContent += `    <${key}>\n`;
            value.forEach((arrayItem, index) => {
              xmlContent += `      <item index="${index}">${escapeXml(String(arrayItem))}</item>\n`;
            });
            xmlContent += `    </${key}>\n`;
          } 
          // Handle simple values
          else {
            xmlContent += `    <${key}>${escapeXml(String(value))}</${key}>\n`;
          }
        }
      }
    });
    
    xmlContent += `  </${entityType}>\n`;
  });
  
  xmlContent += `</${filename}>`;
  
  const blob = new Blob([xmlContent], { type: 'application/xml' });
  downloadFile(blob, `${filename}.xml`);
}

function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function exportAllData(companies: any[], customers: any[], invoices: any[]): void {
  // Export all data as a single ZIP file
  // For now, we'll just export them individually
  exportToJson(companies, 'empresas');
  exportToJson(customers, 'clientes');
  exportToJson(invoices, 'facturas');
}
