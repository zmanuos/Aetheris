using System;
using System.Collections.Generic;
using System.Data;
using MySql.Data.MySqlClient;

using System.ComponentModel.DataAnnotations;

public class NotaPost
{
    public int id_familiar { get; set; }

    public string notaTexto { get; set; }
}

