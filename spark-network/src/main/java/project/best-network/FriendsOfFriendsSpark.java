package project.bestnetwork;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.*;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.SparkSession;

import project.config.Config;
import project.storage.SparkConnector;
import scala.Tuple2;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;





public class FriendsOfFriendsSpark {
    static Logger logger = LogManager.getLogger(FriendsOfFriendsSpark.class);
    /**
     * Connection to Apache Spark
     */
    SparkSession spark;
    JavaSparkContext context;

    public FriendsOfFriendsSpark() {
        System.setProperty("file.encoding", "UTF-8");
    }

    /**
     * Initialize the database connection. Do not modify this method.
     *
     * @throws InterruptedException User presses Ctrl-C
     */
    public void initialize() throws InterruptedException {
        logger.info("Connecting to Spark...");

        spark = SparkConnector.getSparkConnection();
        context = SparkConnector.getSparkContext();

        logger.debug("Connected!");
    }

    /**
     * Fetch the social network from mysql using a JDBC connection, and create a (followed, follower) edge graph
     *
     * @return JavaPairRDD: (followed: String, follower: String) The social network
     */
    public JavaPairRDD<String, String> getSocialNetworkFromJDBC() {
        try {
            logger.info("Connecting to database...");
            Connection connection = null;

            try {
                connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                        Config.DATABASE_PASSWORD);
            } catch (SQLException e) {
                logger.error("Connection to database failed: " + e.getMessage(), e);
                logger.error("Please make sure the RDS server is correct, the tunnel is enabled, and you have run the mysql command to create the database.");
                System.exit(1);
            }

            if (connection == null) {
                logger.error("Failed to make connection - Connection is null");
                System.exit(1);
            }

            logger.info("Successfully connected to database!");
            // likeToPost with user id and post id
            // merge in posts and only keep when parent post is null
            //put in java pair rdd with user id and post id

            String sql = "SELECT users.id AS user_id, 'u' AS utag, posts.post_id AS post_id, 'p' AS ptag " +
                          "FROM users " +
                          "JOIN posts ON users.id = posts.author_id " +
                          "WHERE posts.parent_post IS NULL";
            
            
            Statement stmt = connection.createStatement();
            ResultSet resultSet = stmt.executeQuery(sql);
            // Process the result set and create a list of Tuple2 representing users and posts
            List<Tuple2<Tuple2<Integer, String>, Tuple2<Integer, String>>> networkList = new ArrayList<>();
            while (resultSet.next()) {
                int user_id = resultSet.getInt("user_id");
                int post_id = resultSet.getInt("post_id");
                networkList.add(new Tuple2<>(new Tuple2<>(user_id, "u"), new Tuple2<>(post_id, "p")));
            }

            // Convert the list to JavaRDD and then to JavaPairRDD
            JavaRDD<Tuple2<Tuple2<Integer, String>, Tuple2<Integer, String>>> rdd = context.parallelize(networkList);
            JavaPairRDD<Tuple2<Integer, String>, Tuple2<Integer, String>> network = rdd.mapToPair(pair -> new Tuple2<>(pair._1(), pair._2()));

            // Show the result
            network.foreach(pair -> System.out.println(pair._1() + " -> " + pair._2()));

            return null;

        } catch (Exception e) {
            logger.error("SQL error occurred: " + e.getMessage(), e);
        }
        // Return a default value if the method cannot return a valid result
        return context.emptyRDD().mapToPair(x -> new Tuple2<>("", ""));
    }

    /**
     * Friend-of-a-Friend Recommendation Algorithm
     *
     * @param network JavaPairRDD: (followed: String, follower: String) The social network
     * @return JavaPairRDD: ((person, recommendation), strength) The friend-of-a-friend recommendations
     */
    private JavaPairRDD<Tuple2<String, String>, Integer> friendOfAFriendRecommendations(
            JavaPairRDD<String, String> network) {
        // TODO: Generate friend-of-a-friend recommendations by computing the set of 2nd-degree followed users. This
        //  method should do the same thing as the `friendOfAFriendRecommendations` method in the
        //  `FriendsOfFriendsStreams` class, but using Spark's RDDs instead of Java Streams.
        JavaPairRDD<String, String> toNetwork = network
                .mapToPair(pair -> new Tuple2<>(pair._2(), pair._1()));
        
        JavaPairRDD<String, String> joined = network.join(toNetwork)
            .mapToPair(pair -> new Tuple2<>(pair._2()._1(), pair._2()._2()));

        JavaPairRDD<String, String> filtered = joined
                .filter(pair -> !pair._1().equals(pair._2()));

        filtered = filtered
            .subtract(toNetwork);

        JavaPairRDD<Tuple2<String, String>, Integer> recommendations = filtered
            .mapToPair(pair -> new Tuple2<>(pair, 1))
            .reduceByKey(Integer::sum);

        // count = recommendations.count();
        // System.out.println("Number of items in the network JavaPairRDD: " + count);
        return recommendations;
    }  

    /**
     * Send recommendation results back to the database
     *
     * @param recommendations List: (followed: String, follower: String)
     *                        The list of recommendations to send back to the database
     */
    public void sendResultsToDatabase(List<Tuple2<Tuple2<String, String>, Integer>> recommendations) {
        try (Connection connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                Config.DATABASE_PASSWORD)) {
            // TODO: Write your recommendations data back to imdbdatabase.
            String sql;
            sql = "DROP TABLE IF EXISTS recommendations_2";
            Statement stmt1 = connection.createStatement();
            stmt1.execute(sql);

            sql = "CREATE TABLE IF NOT EXISTS recommendations_2 (" +
                "person VARCHAR(10)," +
                "recommendation VARCHAR(10)," +
                "strength INT," +
                "PRIMARY KEY (person, recommendation)," + 
                "FOREIGN KEY (person) REFERENCES names(nconst)," +
                "FOREIGN KEY (recommendation) REFERENCES names(nconst)" +
            ")";

            Statement stmt2 = connection.createStatement();
            stmt2.execute(sql);

           sql = "INSERT INTO recommendations_2 (person, recommendation, strength) VALUES (?, ?, ?)";
           PreparedStatement stmt = connection.prepareStatement(sql);

            for (Tuple2<Tuple2<String, String>, Integer> rec : recommendations) {
                // String query3 = "SELECT COUNT(*) FROM (SELECT DISTINCT person, recommendation FROM recommendations_2) AS temp";
                // Statement stmt3 = connection.createStatement();
                // ResultSet resultSet = stmt3.executeQuery(query3);
                // while (resultSet.next()) {
                //     System.out.println(resultSet.getInt(1));
                // }
                String friend = rec._1()._1();
                String followed = rec._1()._2();
                int strength = rec._2();
                stmt.setString(1, friend);
                stmt.setString(2, followed);
                stmt.setInt(3, strength);
                stmt.executeUpdate(); // Execute the insert statement for each record
            }
        stmt.close();
        } catch (SQLException e) {
            logger.error("Error sending recommendations to database: " + e.getMessage(), e);
        }
    }

    /**
     * Write the recommendations to a CSV file. Do not modify this method.
     *
     * @param recommendations List: (followed: String, follower: String)
     */
    public void writeResultsCsv(List<Tuple2<Tuple2<String, String>, Integer>> recommendations) {
        // Create a new file to write the recommendations to
        File file = new File("recommendations_2.csv");
        try (PrintWriter writer = new PrintWriter(file)) {
            // Write the recommendations to the file
            for (Tuple2<Tuple2<String, String>, Integer> recommendation : recommendations) {
                writer.println(recommendation._1._1 + "," + recommendation._1._2 + "," + recommendation._2);
            }
        } catch (Exception e) {
            logger.error("Error writing recommendations to file: " + e.getMessage(), e);
        }
    }

    /**
     * Main functionality in the program: read and process the social network. Do not modify this method.
     *
     * @throws IOException          File read, network, and other errors
     * @throws InterruptedException User presses Ctrl-C
     */
    public void run() throws IOException, InterruptedException {
        logger.info("Running");

        // Load the social network:
        // Format of JavaPairRDD = (followed, follower)
        JavaPairRDD<String, String> network = getSocialNetworkFromJDBC();

        // Friend-of-a-Friend Recommendation Algorithm:
        // Format of JavaPairRDD = ((person, recommendation), strength)
        JavaPairRDD<Tuple2<String, String>, Integer> recommendations = friendOfAFriendRecommendations(network);

        // Collect results and send results back to database:
        // Format of List = ((person, recommendation), strength)
        if (recommendations == null) {
            logger.error("Recommendations are null");
            return;
        }
        List<Tuple2<Tuple2<String, String>, Integer>> collectedRecommendations = recommendations.collect();
        writeResultsCsv(collectedRecommendations);
        sendResultsToDatabase(collectedRecommendations);

        logger.info("*** Finished friend of friend recommendations! ***");
    }

    /**
     * Graceful shutdown
     */
    public void shutdown() {
        logger.info("Shutting down");

        if (spark != null) {
            spark.close();
        }
    }

    public static void main(String[] args) {
        final FriendsOfFriendsSpark fofs = new FriendsOfFriendsSpark();
        try {
            fofs.initialize();
            fofs.run();
        } catch (final IOException ie) {
            logger.error("IO error occurred: " + ie.getMessage(), ie);
        } catch (final InterruptedException e) {
            logger.error("Interrupted: " + e.getMessage(), e);
        } finally {
            fofs.shutdown();
        }
    }
}
