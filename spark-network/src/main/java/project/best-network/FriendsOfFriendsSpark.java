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
    public JavaPairRDD<Tuple2<Integer, String>, Tuple2<Integer, String>> getSocialNetworkFromJDBC() {
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
            List<Tuple2<Tuple2<Integer, String>, Tuple2<Integer, String>>> networkList = new ArrayList<>();
            
            
            // SQL query to select users and their posts where parent_post is NULL
            String userPostSql = "SELECT l.userID, l.postID " +
                     "FROM likeToPost l " +
                     "JOIN posts p ON l.postID = p.post_id " +
                     "WHERE p.parent_post IS NULL";

            Statement userPostStmt = connection.createStatement();
            ResultSet userPostResultSet = userPostStmt.executeQuery(userPostSql);
            while (userPostResultSet.next()) {
                int user_id = userPostResultSet.getInt("userID");
                int post_id = userPostResultSet.getInt("postID");
                networkList.add(new Tuple2<>(new Tuple2<>(user_id, "u"), new Tuple2<>(post_id, "p")));
                networkList.add(new Tuple2<>(new Tuple2<>(post_id, "p"), new Tuple2<>(user_id, "u")));
            }
            userPostResultSet.close();
            userPostStmt.close();

            // SQL query to select users and hashtags they are interested in
            String userHashtagSql = "SELECT userID, hashtagID " +
                                    "FROM hashtagInterests";
            Statement userHashtagStmt = connection.createStatement();
            ResultSet userHashtagResultSet = userHashtagStmt.executeQuery(userHashtagSql);
            while (userHashtagResultSet.next()) {
                int user_id = userHashtagResultSet.getInt("userID");
                int hashtag_id = userHashtagResultSet.getInt("hashtagID");
                networkList.add(new Tuple2<>(new Tuple2<>(user_id, "u"), new Tuple2<>(hashtag_id, "h")));
                networkList.add(new Tuple2<>(new Tuple2<>(hashtag_id, "h"), new Tuple2<>(user_id, "u")));
            }
            userHashtagResultSet.close();
            userHashtagStmt.close();

            // SQL query to select posts and hashtags associated with them
            String postHashtagSql = "SELECT post_id, hashtag_id " +
                                    "FROM post_to_hashtags";

            Statement postHashtagStmt = connection.createStatement();
            ResultSet postHashtagResultSet = postHashtagStmt.executeQuery(postHashtagSql);
            while (postHashtagResultSet.next()) {
                int post_id = postHashtagResultSet.getInt("post_id");
                int hashtag_id = postHashtagResultSet.getInt("hashtag_id");
                networkList.add(new Tuple2<>(new Tuple2<>(post_id, "p"), new Tuple2<>(hashtag_id, "h")));
            }
            postHashtagResultSet.close();
            postHashtagStmt.close();


            // SQL query to select friends/followers
            String friendsSql = "SELECT followed, follower FROM friends";

            Statement friendsStmt = connection.createStatement();
            ResultSet friendsResultSet = friendsStmt.executeQuery(friendsSql);
            while (friendsResultSet.next()) {
                int followedUserId = friendsResultSet.getInt("followed");
                int followerUserId = friendsResultSet.getInt("follower");
                System.out.println(followedUserId);
                networkList.add(new Tuple2<>(new Tuple2<>(followedUserId, "u"), new Tuple2<>(followerUserId, "u")));
            }
            friendsResultSet.close();
            friendsStmt.close();

            // Convert the list to JavaRDD and then to JavaPairRDD
            JavaRDD<Tuple2<Tuple2<Integer, String>, Tuple2<Integer, String>>> rdd = context.parallelize(networkList);
            JavaPairRDD<Tuple2<Integer, String>, Tuple2<Integer, String>> network = rdd.mapToPair(pair -> new Tuple2<>(pair._1(), pair._2()));

            // Show the result
            network.foreach(pair -> System.out.println(pair._1() + " -> " + pair._2()));

            return network;

        } catch (Exception e) {
            logger.error("SQL error occurred: " + e.getMessage(), e);
        }
        // Return a default value if the method cannot return a valid result
        return context.emptyRDD().mapToPair(x -> new Tuple2<>(new Tuple2<>(0, "default"), new Tuple2<>(0, "default")));

    }

    /**
     * Adsorption Recommendation Algorithm!!! 
     */
    private void computeEdgeRDD(
            JavaPairRDD<Tuple2<Integer, String>, Tuple2<Integer, String>> network) {

        JavaPairRDD<Tuple2<Tuple2<Integer, String>, Tuple2<Integer, String>>, Integer> edgeRDD = network
        .mapToPair(edge -> {
            Tuple2<Integer, String> key = edge._1();
            Tuple2<Integer, String> value = edge._2();
            return new Tuple2<>(new Tuple2<>(key, value), 1);
        });

       JavaPairRDD<Tuple2<Integer, String>, Integer> userWeightsSum = edgeRDD
        .filter(edge -> edge._1()._1()._2().equals("u"))
        .mapToPair(edge -> {
            Tuple2<Tuple2<Integer, String>, Tuple2<Integer, String>> key = edge._1();
            Tuple2<Integer, String> value = edge._2();
            // Check the second part of the key tuple and map to the appropriate key
            if (key._2()._2().equals("p")) {
                return new Tuple2<>(new Tuple2<>(key._1()._1(), "p"), value);
            } else if (key._2()._2().equals("h")) {
                return new Tuple2<>(new Tuple2<>(key._1()._1(), "h"), value);
            } else if (key._2()._2().equals("u")) {
                return new Tuple2<>(new Tuple2<>(key._1()._1(), "u"), value);
            } else {
                // Return a default tuple if the condition is not met
                return new Tuple2<>(new Tuple2<>(0, "default"), 0);
            }
        })
        .filter(edge -> !edge._1()._2().equals("default")) // Filter out the default tuples
        .reduceByKey(Integer::sum);

        

        // return edgeRDD;
    }  

    /**
     * Send back to database
     */
    public void sendResultsToDatabase(List<Tuple2<Tuple2<String, String>, Integer>> recommendations) {
        try (Connection connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                Config.DATABASE_PASSWORD)) {
        //     // TODO: Write your recommendations data back to imdbdatabase.
        //     String sql;
        //     sql = "DROP TABLE IF EXISTS recommendations_2";
        //     Statement stmt1 = connection.createStatement();
        //     stmt1.execute(sql);

        //     sql = "CREATE TABLE IF NOT EXISTS recommendations_2 (" +
        //         "person VARCHAR(10)," +
        //         "recommendation VARCHAR(10)," +
        //         "strength INT," +
        //         "PRIMARY KEY (person, recommendation)," + 
        //         "FOREIGN KEY (person) REFERENCES names(nconst)," +
        //         "FOREIGN KEY (recommendation) REFERENCES names(nconst)" +
        //     ")";

        //     Statement stmt2 = connection.createStatement();
        //     stmt2.execute(sql);

        //    sql = "INSERT INTO recommendations_2 (person, recommendation, strength) VALUES (?, ?, ?)";
        //    PreparedStatement stmt = connection.prepareStatement(sql);

        //     for (Tuple2<Tuple2<String, String>, Integer> rec : recommendations) {
        //         // String query3 = "SELECT COUNT(*) FROM (SELECT DISTINCT person, recommendation FROM recommendations_2) AS temp";
        //         // Statement stmt3 = connection.createStatement();
        //         // ResultSet resultSet = stmt3.executeQuery(query3);
        //         // while (resultSet.next()) {
        //         //     System.out.println(resultSet.getInt(1));
        //         // }
        //         String friend = rec._1()._1();
        //         String followed = rec._1()._2();
        //         int strength = rec._2();
        //         stmt.setString(1, friend);
        //         stmt.setString(2, followed);
        //         stmt.setInt(3, strength);
        //         stmt.executeUpdate(); // Execute the insert statement for each record
        //     }
        // stmt.close();
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
     * RUN Spark
     */
    public void run() throws IOException, InterruptedException {
        logger.info("Running");

        // Load the social network:
        JavaPairRDD<Tuple2<Integer, String>, Tuple2<Integer, String>> network = getSocialNetworkFromJDBC();

        // Friend-of-a-Friend Recommendation Algorithm:
        computeEdgeRDD(network);

        // // Collect results and send results back to database:
        // // Format of List = ((person, recommendation), strength)
        // if (recommendations == null) {
        //     logger.error("Recommendations are null");
        //     return;
        // }
        // List<Tuple2<Tuple2<String, String>, Integer>> collectedRecommendations = recommendations.collect();
        // writeResultsCsv(collectedRecommendations);
        // sendResultsToDatabase(collectedRecommendations);

        logger.info("*** Finished Adsorption! ***");
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
