import { NextResponse } from "next/server";
import { conn } from "../libs/mysql";

interface DataItem {
  campo: string;
  sub_diario: string;
  numero_comprobante: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  tipo_cp: string;
  serie: string;
  identificacion: string;
  nombre: string;
  monto: number;
  debe_haber: string;
  moneda: string;
  igv: number;
  cuenta_contable: string;
  codigo_anexo_aux: string;
  tipo_doc_ref: string;
  num_doc_ref: string;
  fecha_doc_ref: string;
  tipo_convers: string;
  flag_conver_mon: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { data }: { data: DataItem[] } = await request.json(); // Recibe los datos enviados desde el frontend

    // Verificar si hay datos
    if (!data || data.length === 0) {
      return NextResponse.json(
        { message: "No se proporcionaron datos" },
        { status: 400 }
      );
    }

    // Preparar los valores para la consulta SQL
    const values = data.map(
      ({
        campo,
        sub_diario,
        numero_comprobante,
        fecha_emision,
        fecha_vencimiento,
        tipo_cp,
        serie,
        identificacion,
        nombre,
        monto,
        debe_haber,
        moneda,
        igv,
        cuenta_contable,
        codigo_anexo_aux,
        tipo_doc_ref,
        num_doc_ref,
        fecha_doc_ref,
        tipo_convers,
        flag_conver_mon,
      }) => [
        campo,
        sub_diario,
        numero_comprobante,
        fecha_emision,
        fecha_vencimiento,
        tipo_cp,
        serie,
        identificacion,
        nombre,
        monto,
        debe_haber,
        moneda,
        igv,
        cuenta_contable,
        codigo_anexo_aux,
        tipo_doc_ref,
        num_doc_ref,
        fecha_doc_ref,
        tipo_convers,
        flag_conver_mon,
      ]
    );

    // Crear la consulta SQL para la inserción masiva
    const query = `
  INSERT INTO masivo (
    campo,
    sub_diario,
    num_comprobante,
    fecha_documento,
    fecha_vencimiento,
    tipo_documento,
    numero_documento,
    codigo_anexo,
    glosa_principal,
    importe_original,
    debe_haber,
    cod_moneda,
    tasa_igv,
    cuenta_contable,
    codigo_auxiliar,
    tipo_doc_referencia,
    num_doc_referencia,
    fecha_doc_referencia,
    tipo_conversion,
    flag_conversion
  ) 
  VALUES ?
`;

    // Ejecutar la consulta de inserción masiva
    const [result]: any = await conn.query(query, [values]);

    // Obtener el primer ID autoincremental generado
    const [insertedIdResult]: any = await conn.query(
      "SELECT LAST_INSERT_ID() AS lastId"
    );

    const lastInsertId = insertedIdResult[0].lastId;
    const lastRecord = lastInsertId + result.affectedRows - 1; // Calcular el último ID insertado si es necesario

    return NextResponse.json({
      message: "Datos insertados exitosamente",
      affectedRows: result.affectedRows,
      first_reg: lastInsertId, // Primer ID generado
      last_reg: lastRecord, // Último ID generado (opcional, si necesitas el rango)
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
