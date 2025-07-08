﻿using System;
using System.Collections.Generic;
using System.Data;

public class ResidenteMapper
{
    public static Residente ToObject(DataRow row)
    {
        Residente residente = new Residente();
        Dispositivo dispositivo = null;

        try
        {
            residente.Id_residente = (Int32)row["id_residente"];
            residente.Nombre = (String)row["nombre"];
            residente.Apellido = (String)row["apellido"];
            residente.Fecha_nacimiento = (DateTime)row["fecha_nacimiento"];
            residente.Genero = (String)row["genero"];
            residente.Telefono = row.IsNull("telefono") ? "" : (string)row["telefono"];
            residente.Foto = row.IsNull("foto") ? "default" : (string)row["foto"]; 
            residente.Fecha_ingreso = (DateTime)row["fecha_ingreso"];
            residente.Activo = (bool)row["activo"];
            residente.PromedioReposo = row.IsNull("promedio_reposo") ? 0 : (Int32)row["promedio_reposo"];
            residente.PromedioActivo = row.IsNull("promedio_activo") ? 0 : (Int32)row["promedio_activo"];
            residente.PromedioAgitado= row.IsNull("promedio_agitado") ? 0 : (Int32)row["promedio_agitado"];
            if (!row.IsNull("dispositivo"))
            {
                int id_dispositivo = (Int32)row["dispositivo"];
                Console.WriteLine($"Mapeando Residente ID: {residente.Id_residente}, intentando obtener Dispositivo ID: {id_dispositivo}");
                try
                {
                    dispositivo = Dispositivo.Get(id_dispositivo);
                    if (dispositivo == null)
                    {
                        Console.WriteLine($"Advertencia: Dispositivo con ID {id_dispositivo} no encontrado o Get() retornó null para Residente ID {residente.Id_residente}.");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error al obtener Dispositivo con ID {id_dispositivo} para Residente ID {residente.Id_residente}: {ex.Message}");
                }
            }
            else
            {
                Console.WriteLine($"Dispositivo es NULL en la base de datos para Residente ID: {residente.Id_residente}.");
            }
            residente.Dispositivo = dispositivo;

            return residente;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error CRÍTICO al mapear DataRow a objeto Residente (ID: {row["id_residente"] ?? "N/A"}): {ex.Message}");
            return null; 
        }
    }

    public static List<Residente> ToList(DataTable table)
    {
        List<Residente> list = new List<Residente>();
        Console.WriteLine($"Intentando mapear {table.Rows.Count} filas a lista de Residentes.");
        foreach (DataRow row in table.Rows)
        {
            Residente residente = ResidenteMapper.ToObject(row);
            if (residente != null)
            {
                list.Add(residente);
            }
            else
            {
                Console.WriteLine("Una fila no pudo ser mapeada a Residente y fue omitida.");
            }
        }
        Console.WriteLine($"Mapeo completado. Se agregaron {list.Count} residentes a la lista.");
        return list;
    }
}