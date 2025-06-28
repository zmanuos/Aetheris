using System.Data;

public class AlertaTipoMapper
{
    public static AlertaTipo ToObject(DataRow row)
    {
        int id = (int)row["id_alerta_tipo"];
        string nombre = (string)row["nombre"];
        string descripcion = row.IsNull("descripcion") ? "" : (string)row["descripcion"];

        return new AlertaTipo(id, nombre, descripcion);
    }
}
