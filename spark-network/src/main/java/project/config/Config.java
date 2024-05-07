package project.config;

/**
 * Global configuration for NETS 2120 homeworks.
 * <p>
 * A better version of this would read a config file from the resources,
 * such as a YAML file. But our first version is designed to be simple
 * and minimal.
 *
 * @author zives
 */
public class Config {

    public static final String DATABASE_CONNECTION = "jdbc:mysql://localhost:3306/bestnetworkDB";
    public static final String DATABASE_USERNAME = "admin";
    public static final String DATABASE_PASSWORD = "best-network";

    public static final String SPARK_APP_NAME = "IMDBRelations";
    public static final String SPARK_MASTER_URL = "local[*]";
    public static final String SPARK_DRIVER_MEMORY = "10g";
    public static final String SPARK_TESTING_MEMORY = "2147480000";

    /**
     * The path to the space-delimited social network data
     */
    public static String LOCAL_SPARK = "local[*]";

    public static String JAR = "target/nets2120-hw3-0.0.1-SNAPSHOT.jar";

    // Retrieve AWS credentials from environment variables
    public static String ACCESS_KEY_ID = System.getenv("ACCESS_KEY_ID");
    public static String SECRET_ACCESS_KEY = System.getenv("SECRET_ACCESS_KEY");
    public static String SESSION_TOKEN = System.getenv("SESSION_TOKEN");

    /**
     * How many RDD partitions to use?
     */
    public static int PARTITIONS = 5;
}
