"use client";
export const dynamic = "force-dynamic";
import { useState, ChangeEvent } from "react";
import ExcelJS from "exceljs";
import axios from "axios";
import { Toaster, toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Mes {
  value: string;
  label: string;
  year?: number;
}

interface RowValues {
  [index: number]: any;
}

function Excelfile() {
  const [file, setFile] = useState<File | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [columnData, setColumnData] = useState<any[][]>([]);
  const [showInput, setShowInput] = useState<boolean>(false);
  const [isDataGenerating, setIsDataGenerating] = useState<boolean>(false);
  const [isFileGenerating, setIsFileGenerating] = useState<boolean>(false);
  const [buttonDisabled, setButtonDisabled] = useState<boolean>(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const meses: Mes[] = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];
  let subCompEx: number = showInput ? parseInt(inputValue) || 0 : 1;

  const subCompValue = String(inputValue).padStart(4, "0");

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const codigoMap: { [key: number]: string } = {
    5: "BA",
    3: "BV",
    6: "CP",
    1: "FT",
    9: "GS",
    13: "LB",
    4: "LQ",
    7: "NA",
    87: "NC",
    8: "ND",
    11: "PB",
    10: "RA",
    14: "RC",
    2: "RH",
    50: "RL",
    37: "RV",
    12: "TK",
  };

  const handleSelect = (mesValue: string) => {
    setSelectedMonth(mesValue);
    setButtonDisabled(false);
  };

  let filteredMeses: Mes[] = [];

  if (currentMonth === 1 || currentMonth === 2) {
    filteredMeses = [
      { value: "12", label: "Diciembre", year: currentYear - 1 },
      ...meses
        .filter((mes) => parseInt(mes.value) <= currentMonth)
        .map((mes) => ({ ...mes, year: currentYear })),
    ];
  } else {
    filteredMeses = meses
      .filter((mes) => parseInt(mes.value) <= currentMonth)
      .map((mes) => ({ ...mes, year: currentYear }));
  }

  const mesesConEtiqueta = filteredMeses.map((mes) => {
    if (parseInt(mes.value) === currentMonth && mes.year === currentYear) {
      return { ...mes, label: `${mes.label} (Actual)` };
    }
    return mes;
  });

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = event.target?.result as ArrayBuffer;

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);
        const worksheet = workbook.worksheets[0];

        const columnIndices = [
          5, 6, 7, 8, 10, 13, 14, 15, 16, 25, 26, 27, 21, 24, 17, 18, 19, 20,
          22, 23,
        ];
        const startRow = 2;

        const values: any[][] = [];
        let recordCount = 0;

        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
          if (rowNumber >= startRow) {
            const rowValues = columnIndices.map(
              (index) => row.getCell(index).value
            );

            if (
              rowValues.some((value) => value !== null && value !== undefined)
            ) {
              values.push(rowValues);
              recordCount++;
            }
          }
        });

        setColumnData(values);
        console.log("Número de registros:", recordCount);
      };

      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const queryId = async () => {
    try {
      const response = await axios.get("/api/query");
      console.log("Datos recibidos:", response.data);
      toast.info(
        `El número de registro mas reciente es: ${response.data.nextId}`
      );
    } catch (error) {
      console.error("Error al obtener los datos:", error);
      toast.error("Hubo un error, intentelo mas tarde.");
    }
  };

  const handleGenerateXLSX = async () => {
    setIsFileGenerating(true);
    setButtonDisabled(true);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet 1");

    worksheet.addRow([
      "campo",
      "sub diario",
      "numero de comprobante",
      "fecha de emision",
      "fecha de vencimiento",
      "tipo cp",
      "serie",
      "identificacion",
      "nombre",
      "monto",
      "debe/haber",
      "moneda",
      "igv",
      "cuenta contable",
    ]);

    let campo = 1;
    const rows: any[][] = [];
    columnData.forEach((rowValues) => {
      const subCompFormatted = String(subCompEx).padStart(4, "0");
      const divisionResult = ((rowValues[8] / rowValues[7]) * 100).toFixed(0);
      const igvValue =
        divisionResult === "18" ? "18" : divisionResult === "10" ? "10" : "";

      if (rowValues[7] !== 0) {
        const row1 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          rowValues[5],
          typeof rowValues[6] === "string"
            ? rowValues[6].substring(0, 40)
            : typeof rowValues[6] === "number"
            ? rowValues[6].toString().substring(0, 40)
            : "Dato inválido",
          rowValues[10] === "USD"
            ? parseFloat((rowValues[7] / rowValues[11]).toFixed(2))
            : rowValues[7],
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
          "603219",
        ];
        rows.push(row1);
      }

      if (rowValues[8] !== 0) {
        const row2 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          rowValues[5],
          typeof rowValues[6] === "string"
            ? rowValues[6].substring(0, 40)
            : typeof rowValues[6] === "number"
            ? rowValues[6].toString().substring(0, 40)
            : "Dato inválido",
          rowValues[10] === "USD"
            ? parseFloat((rowValues[8] / rowValues[11]).toFixed(2))
            : rowValues[8],
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
          "401111",
        ];
        rows.push(row2);
      }

      if (rowValues[14] !== 0) {
        const row3 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          rowValues[5],
          typeof rowValues[6] === "string"
            ? rowValues[6].substring(0, 40)
            : typeof rowValues[6] === "number"
            ? rowValues[6].toString().substring(0, 40)
            : "Dato inválido",
          rowValues[10] === "USD"
            ? parseFloat((rowValues[14] / rowValues[11]).toFixed(2))
            : rowValues[14],
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
          "603219",
        ];
        rows.push(row3);
      }

      if (rowValues[15] !== 0) {
        const row4 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          rowValues[5],
          typeof rowValues[6] === "string"
            ? rowValues[6].substring(0, 40)
            : typeof rowValues[6] === "number"
            ? rowValues[6].toString().substring(0, 40)
            : "Dato inválido",
          rowValues[10] === "USD"
            ? parseFloat((rowValues[15] / rowValues[11]).toFixed(2))
            : rowValues[15],
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
          "401111",
        ];
        rows.push(row4);
      }

      if (rowValues[16] !== 0) {
        const row5 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          rowValues[5],
          typeof rowValues[6] === "string"
            ? rowValues[6].substring(0, 40)
            : typeof rowValues[6] === "number"
            ? rowValues[6].toString().substring(0, 40)
            : "Dato inválido",
          rowValues[10] === "USD"
            ? parseFloat((rowValues[16] / rowValues[11]).toFixed(2))
            : rowValues[16],
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
          "603219",
        ];
        rows.push(row5);
      }

      if (rowValues[17] !== 0) {
        const row6 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          rowValues[5],
          typeof rowValues[6] === "string"
            ? rowValues[6].substring(0, 40)
            : typeof rowValues[6] === "number"
            ? rowValues[6].toString().substring(0, 40)
            : "Dato inválido",
          rowValues[10] === "USD"
            ? parseFloat((rowValues[17] / rowValues[11]).toFixed(2))
            : rowValues[17],
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
          "401111",
        ];
        rows.push(row6);
      }

      if (rowValues[12] !== 0) {
        const row7 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          rowValues[5],
          typeof rowValues[6] === "string"
            ? rowValues[6].substring(0, 40)
            : typeof rowValues[6] === "number"
            ? rowValues[6].toString().substring(0, 40)
            : "Dato inválido",
          rowValues[10] === "USD"
            ? parseFloat((rowValues[12] / rowValues[11]).toFixed(2))
            : rowValues[12],
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
          "603219",
        ];
        rows.push(row7);
      }

      if (rowValues[18] !== 0) {
        const row8 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          rowValues[5],
          typeof rowValues[6] === "string"
            ? rowValues[6].substring(0, 40)
            : typeof rowValues[6] === "number"
            ? rowValues[6].toString().substring(0, 40)
            : "Dato inválido",
          rowValues[10] === "USD"
            ? parseFloat((rowValues[18] / rowValues[11]).toFixed(2))
            : rowValues[18],
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
          "603219",
        ];
        rows.push(row8);
      }

      if (rowValues[19] !== 0) {
        const row9 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          rowValues[5],
          typeof rowValues[6] === "string"
            ? rowValues[6].substring(0, 40)
            : typeof rowValues[6] === "number"
            ? rowValues[6].toString().substring(0, 40)
            : "Dato inválido",
          rowValues[10] === "USD"
            ? parseFloat((rowValues[19] / rowValues[11]).toFixed(2))
            : rowValues[19],
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
          "603219",
        ];
        rows.push(row9);
      }

      if (rowValues[13] !== 0) {
        const row10 = [
          campo,
          11,
          `${selectedMonth}${subCompFormatted}`,
          rowValues[0],
          rowValues[0],
          codigoMap[rowValues[2]] || rowValues[2],
          `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          rowValues[5],
          typeof rowValues[6] === "string"
            ? rowValues[6].substring(0, 40)
            : typeof rowValues[6] === "number"
            ? rowValues[6].toString().substring(0, 40)
            : "Dato inválido",
          rowValues[10] === "USD"
            ? parseFloat((rowValues[13] / rowValues[11]).toFixed(2))
            : rowValues[13],
          "D",
          rowValues[10] === "PEN" ? "MN" : "US",
          igvValue,
          "641901",
        ];
        rows.push(row10);
      }

      const row11 = [
        campo,
        11,
        `${selectedMonth}${subCompFormatted}`,
        rowValues[0],
        rowValues[0],
        codigoMap[rowValues[2]] || rowValues[2],
        `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
        rowValues[5],
        typeof rowValues[6] === "string"
          ? rowValues[6].substring(0, 40)
          : typeof rowValues[6] === "number"
          ? rowValues[6].toString().substring(0, 40)
          : "Dato inválido",
        rowValues[10] === "USD"
          ? parseFloat((rowValues[9] / rowValues[11]).toFixed(2))
          : rowValues[9],
        "H",
        rowValues[10] === "PEN" ? "MN" : "US",
        igvValue,
        rowValues[10] === "PEN" ? "421201" : "421202",
      ];
      rows.push(row11);

      const isEvenGroup = campo % 2 === 0;

      rows.forEach((row) => {
        const newRow = worksheet.addRow(row);
        if (isEvenGroup) {
          newRow.eachCell({ includeEmpty: true }, (cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "D3D3D3" },
            };
          });
        }
      });

      campo++;
      subCompEx++;
      rows.length = 0;
    });

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const formattedTime = `${String(now.getHours()).padStart(2, "0")}.${String(
      now.getMinutes()
    ).padStart(2, "0")}.${String(now.getSeconds()).padStart(2, "0")}`;
    const fileName = `documento_${formattedDate}_${formattedTime}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => {
      setIsFileGenerating(false);
      setButtonDisabled(false);
      toast.success("Archivo creado con exito");
    }, 1000);
  };

  const handleSendToDatabase = async () => {
    setIsDataGenerating(true);
    setButtonDisabled(true);
    const dataToSend: any[] = [];
    let campo = 1;
    const now = new Date();

    columnData.forEach((rowValues) => {
      const dataTempToSend: any[] = [];
      const subCompFormatted = String(subCompEx).padStart(4, "0");
      const divisionResult = ((rowValues[8] / rowValues[7]) * 100).toFixed(0);
      const igvValue =
        divisionResult === "18" ? "18" : divisionResult === "10" ? "10" : "";

      if (rowValues[7] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],
          nombre:
            typeof rowValues[6] === "string"
              ? rowValues[6].substring(0, 40)
              : typeof rowValues[6] === "number"
              ? rowValues[6].toString().substring(0, 40)
              : "Dato inválido",
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[7] / rowValues[11]).toFixed(2))
              : rowValues[7],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "603219",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      if (rowValues[8] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],
          nombre:
            typeof rowValues[6] === "string"
              ? rowValues[6].substring(0, 40)
              : typeof rowValues[6] === "number"
              ? rowValues[6].toString().substring(0, 40)
              : "Dato inválido",
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[8] / rowValues[11]).toFixed(2))
              : rowValues[8],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "401111",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      if (rowValues[14] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],
          nombre:
            typeof rowValues[6] === "string"
              ? rowValues[6].substring(0, 40)
              : typeof rowValues[6] === "number"
              ? rowValues[6].toString().substring(0, 40)
              : "Dato inválido",
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[14] / rowValues[11]).toFixed(2))
              : rowValues[14],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "603219",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      if (rowValues[15] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],
          nombre:
            typeof rowValues[6] === "string"
              ? rowValues[6].substring(0, 40)
              : typeof rowValues[6] === "number"
              ? rowValues[6].toString().substring(0, 40)
              : "Dato inválido",
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[15] / rowValues[11]).toFixed(2))
              : rowValues[15],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "401111",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      if (rowValues[16] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],
          nombre:
            typeof rowValues[6] === "string"
              ? rowValues[6].substring(0, 40)
              : typeof rowValues[6] === "number"
              ? rowValues[6].toString().substring(0, 40)
              : "Dato inválido",
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[16] / rowValues[11]).toFixed(2))
              : rowValues[16],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "603219",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      if (rowValues[17] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],
          nombre:
            typeof rowValues[6] === "string"
              ? rowValues[6].substring(0, 40)
              : typeof rowValues[6] === "number"
              ? rowValues[6].toString().substring(0, 40)
              : "Dato inválido",
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[17] / rowValues[11]).toFixed(2))
              : rowValues[17],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "401111",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      if (rowValues[12] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],
          nombre:
            typeof rowValues[6] === "string"
              ? rowValues[6].substring(0, 40)
              : typeof rowValues[6] === "number"
              ? rowValues[6].toString().substring(0, 40)
              : "Dato inválido",
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[12] / rowValues[11]).toFixed(2))
              : rowValues[12],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "603219",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      if (rowValues[18] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],
          nombre:
            typeof rowValues[6] === "string"
              ? rowValues[6].substring(0, 40)
              : typeof rowValues[6] === "number"
              ? rowValues[6].toString().substring(0, 40)
              : "Dato inválido",
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[18] / rowValues[11]).toFixed(2))
              : rowValues[18],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "603219",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      if (rowValues[19] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],
          nombre:
            typeof rowValues[6] === "string"
              ? rowValues[6].substring(0, 40)
              : typeof rowValues[6] === "number"
              ? rowValues[6].toString().substring(0, 40)
              : "Dato inválido",
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[19] / rowValues[11]).toFixed(2))
              : rowValues[19],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "603219",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      if (rowValues[13] !== 0) {
        dataTempToSend.push({
          campo: campo,
          sub_diario: 11,
          numero_comprobante: `${selectedMonth}${subCompFormatted}`,
          fecha_emision: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          fecha_vencimiento: new Date(rowValues[0])
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
          serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
          identificacion: rowValues[5],
          nombre:
            typeof rowValues[6] === "string"
              ? rowValues[6].substring(0, 40)
              : typeof rowValues[6] === "number"
              ? rowValues[6].toString().substring(0, 40)
              : "Dato inválido",
          monto:
            rowValues[10] === "USD"
              ? parseFloat((rowValues[13] / rowValues[11]).toFixed(2))
              : rowValues[13],
          debe_haber: "D",
          moneda: rowValues[10] === "PEN" ? "MN" : "US",
          igv: igvValue,
          cuenta_contable: "641901",
          codigo_anexo_aux: "",
          tipo_doc_ref: "",
          num_doc_ref: "",
          fecha_doc_ref: null,
          tipo_convers: "V",
          flag_conver_mon: "S",
        });
      }

      dataTempToSend.push({
        campo: campo,
        sub_diario: 11,
        numero_comprobante: `${selectedMonth}${subCompFormatted}`,
        fecha_emision: new Date(rowValues[0])
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
        fecha_vencimiento: new Date(rowValues[0])
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
        tipo_cp: codigoMap[rowValues[2]] || rowValues[2],
        serie: `${rowValues[3]}-${String(rowValues[4]).padStart(8, "0")}`,
        identificacion: rowValues[5],
        nombre:
          typeof rowValues[6] === "string"
            ? rowValues[6].substring(0, 40)
            : typeof rowValues[6] === "number"
            ? rowValues[6].toString().substring(0, 40)
            : "Dato inválido",
        monto:
          rowValues[10] === "USD"
            ? parseFloat((rowValues[9] / rowValues[11]).toFixed(2))
            : rowValues[9],
        debe_haber: "H",
        moneda: rowValues[10] === "PEN" ? "MN" : "US",
        igv: igvValue,
        cuenta_contable: rowValues[10] === "PEN" ? "421201" : "421202",
        codigo_anexo_aux: "SAT",
        tipo_doc_ref: "",
        num_doc_ref: "",
        fecha_doc_ref: null,
        tipo_convers: "V",
        flag_conver_mon: "S",
      });

      campo++;
      subCompEx++;
      dataTempToSend[0].tipo_doc_ref = "OC";
      dataTempToSend[0].num_doc_ref = "SN";
      dataTempToSend[0].fecha_doc_ref = new Date(rowValues[0])
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      dataToSend.push(...dataTempToSend);
      //dataTempToSend.value = 0;
    });

    try {
      const response = await axios.post("/api/dbsend", { data: dataToSend });
      console.log("Datos enviados:", response.data);
      toast.success(
        `Datos enviados con éxito, el último numero de registro es: ${response.data.last_reg}`
      );
    } catch (error) {
      console.error("Error al enviar datos:", error);
      toast.error("Error al enviar datos");
    }
    setTimeout(() => {
      setIsDataGenerating(false);
      setButtonDisabled(false);
    }, 1000);
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="py-2">
        <h4 className="text-base font-medium leading-none">1. Subir archivo</h4>
      </div>
      <Separator />
      <div className="grid grid-cols-3 py-4">
        <form>
          <div className="pb-4 flex gap-4">
            <Label htmlFor="excel">1.1. Seleccionar Archivo</Label>
          </div>
          <Input
            id="excel"
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
          />
        </form>
      </div>
      <div className="py-2">
        <h4 className="text-base font-medium leading-none">2. Vista Previa</h4>
      </div>
      <Separator />
      <div className="py-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identificacion</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>BI</TableHead>
              <TableHead>IGV</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Moneda</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {columnData.slice(0, 4).map((rowValues, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell>
                  <div className="font-medium">{rowValues[5]}</div>
                </TableCell>
                <TableCell>{rowValues[6]}</TableCell>
                <TableCell>{rowValues[7]}</TableCell>
                <TableCell>{rowValues[8]}</TableCell>
                <TableCell>
                  <div className="font-medium">{rowValues[9]}</div>
                </TableCell>
                <TableCell>{rowValues[10] === "PEN" ? "MN" : "US"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="py-2">
        <h4 className="text-base font-medium leading-none">3. Envios</h4>
      </div>

      <Separator />
      <div className="py-4 flex gap-4">
        <Label htmlFor="excel">
          3.1. Escoger mes del numero de comprobante
        </Label>
      </div>
      <div className="pb-4 flex gap-4">
        <Select onValueChange={(value) => handleSelect(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Seleccione un mes" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {mesesConEtiqueta.map((mes) => (
                <SelectItem key={mes.value} value={mes.value}>
                  {mes.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="pb-4 flex gap-4">
        <RadioGroup defaultValue="option-one">
          <div className="pb-4 flex gap-4">
            <Label htmlFor="excel">3.2. Escoger numero de comprobante</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="option-one"
              id="option-one"
              onClick={() => setShowInput(false)}
            />
            <Label htmlFor="option-one">Empezar desde 0 (0001)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="option-two"
              id="option-two"
              onClick={() => setShowInput(true)}
            />
            <Label htmlFor="option-two">
              Asignar numero (Usar el boton rojo Numero de registro reciente)
            </Label>
          </div>
          {showInput && (
            <div>
              <div className="py-2 flex gap-4">
                <Input
                  type="number"
                  placeholder="Número"
                  value={inputValue}
                  onChange={handleInputChange}
                />
              </div>

              <Label>
                Debe colocar el numero que le continua al numero de registro
                reciente
              </Label>
            </div>
          )}
          <div className="pt-4 flex gap-4">
            <Label htmlFor="excel">
              Ejemplo: {selectedMonth}
              {showInput ? subCompValue : "0001"}
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="pt-4 flex justify-between gap-4">
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleGenerateXLSX}
            className="bg-green-700 text-white hover:bg-green-300"
            disabled={buttonDisabled}
          >
            {isFileGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando
              </>
            ) : (
              "Generar XLSX"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleSendToDatabase}
            className="bg-sky-700 text-white hover:bg-sky-300"
            disabled={buttonDisabled}
          >
            {isDataGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando
              </>
            ) : (
              "Enviar a Base de Datos"
            )}
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={queryId}
          className="bg-red-700 text-white hover:bg-red-300"
          disabled={buttonDisabled}
        >
          {isDataGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando
            </>
          ) : (
            "Numero de registro reciente"
          )}
        </Button>
      </div>
    </>
  );
}

export default Excelfile;
