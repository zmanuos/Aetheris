
using MongoDB.Driver;
using MongoDB.Bson;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext()
    {
        var connectionString = "mongodb://localhost:27017"; 
        var client = new MongoClient(connectionString);
        _database = client.GetDatabase("aetheris");
    }

    public IMongoCollection<T> GetCollection<T>(string collectionName)
    {
        return _database.GetCollection<T>(collectionName);
    }
}
