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





public class runSocialNetwork {
    static Logger logger = LogManager.getLogger(runSocialNetwork.class);
    /**
     * Connection to Apache Spark
     */
    SparkSession spark;
    JavaSparkContext context;

    public runSocialNetwork() {
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
     * get network
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
                networkList.add(new Tuple2<>(new Tuple2<>(hashtag_id, "h"), new Tuple2<>(post_id, "p")));
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
                networkList.add(new Tuple2<>(new Tuple2<>(followedUserId, "u"), new Tuple2<>(followerUserId, "u")));
            }
            friendsResultSet.close();
            friendsStmt.close();

            // Convert the list to JavaRDD and then to JavaPairRDD
            JavaRDD<Tuple2<Tuple2<Integer, String>, Tuple2<Integer, String>>> rdd = context.parallelize(networkList);
            JavaPairRDD<Tuple2<Integer, String>, Tuple2<Integer, String>> network = rdd.mapToPair(pair -> new Tuple2<>(pair._1(), pair._2()));

            // Show the result
            // network.foreach(pair -> System.out.println(pair._1() + " -> " + pair._2()));

            return network;

        } catch (Exception e) {
            logger.error("SQL error occurred: " + e.getMessage(), e);
        }
        // Return a default value if the method cannot return a valid result
        return context.emptyRDD().mapToPair(x -> new Tuple2<>(new Tuple2<>(0, "default"), new Tuple2<>(0, "default")));

    }

    /**
     * get Users RDD for user labels and weights
     */
    public JavaRDD<Integer> getUsersFromJDBC() {
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

            List<Integer> usersList = new ArrayList<>();

            String sql = "SELECT id FROM users";
            Statement stmt = connection.createStatement();
            ResultSet resultSet = stmt.executeQuery(sql);

            while (resultSet.next()) {
                int user_id = resultSet.getInt("id");
                usersList.add(user_id);
            }

            resultSet.close();
            stmt.close();

            JavaRDD<Integer> usersRDD = context.parallelize(usersList);

            return usersRDD;

        } catch (Exception e) {
            logger.error("SQL error occurred: " + e.getMessage(), e);
        }
        // Return a default value if the method cannot return a valid result
        return context.emptyRDD();

    }

    /**
     * Edge Computation for Network for adsorption algorithm!! 
     */
    private JavaPairRDD<Tuple2<Integer, String>, Tuple2<Tuple2<Integer, String>, Double>> computeEdgeRDD(
            JavaPairRDD<Tuple2<Integer, String>, Tuple2<Integer, String>> networkRDD) {

       JavaPairRDD<Tuple2<Tuple2<Integer, String>, Tuple2<Integer, String>>, Integer> edgeRDD = networkRDD
            .mapToPair(edge -> {
                Tuple2<Integer, String> key = edge._1();
                Tuple2<Integer, String> value = edge._2();
                return new Tuple2<>(new Tuple2<>(key, value), 1);
            });
        
        JavaPairRDD<Tuple2<Integer, String>, Double> userHashtagWeightsSum = edgeRDD
            .filter(edge -> edge._1()._1()._2().equals("u") && edge._1()._2()._2().equals("h")) 
            .mapToPair(edge -> {
                Tuple2<Tuple2<Integer, String>, Tuple2<Integer, String>> key = edge._1();
                Integer value = edge._2();
                return new Tuple2<>(key._1(), value);
            })
            .reduceByKey(Integer::sum)
            .mapToPair(tuple -> new Tuple2<>(tuple._1(), .3 / tuple._2())); 

        JavaPairRDD<Tuple2<Integer, String>, Tuple2<Tuple2<Integer, String>, Double>> userHashtagEdges = networkRDD
            .filter(edge -> edge._1()._2().equals("u") && edge._2()._2().equals("h"))
            .join(userHashtagWeightsSum);



        JavaPairRDD<Tuple2<Integer, String>, Double> userPostWeightsSum = edgeRDD
            .filter(edge -> edge._1()._1()._2().equals("u") && edge._1()._2()._2().equals("p")) 
            .mapToPair(edge -> {
                Tuple2<Tuple2<Integer, String>, Tuple2<Integer, String>> key = edge._1();
                Integer value = edge._2();
                return new Tuple2<>(key._1(), value);
            })
            .reduceByKey(Integer::sum)
            .mapToPair(tuple -> new Tuple2<>(tuple._1(), .4 / tuple._2())); 

        JavaPairRDD<Tuple2<Integer, String>, Tuple2<Tuple2<Integer, String>, Double>> userPostEdges = networkRDD
            .filter(edge -> edge._1()._2().equals("u") && edge._2()._2().equals("p"))
            .join(userPostWeightsSum);

        
        JavaPairRDD<Tuple2<Integer, String>, Double> userUserWeightsSum = edgeRDD
            .filter(edge -> edge._1()._1()._2().equals("u") && edge._1()._2()._2().equals("u")) 
            .mapToPair(edge -> {
                Tuple2<Tuple2<Integer, String>, Tuple2<Integer, String>> key = edge._1();
                Integer value = edge._2();
                return new Tuple2<>(key._1(), value);
            })
            .reduceByKey(Integer::sum)
            .mapToPair(tuple -> new Tuple2<>(tuple._1(), .4 / tuple._2())); 

        JavaPairRDD<Tuple2<Integer, String>, Tuple2<Tuple2<Integer, String>, Double>> userUserEdges = networkRDD
            .filter(edge -> edge._1()._2().equals("u") && edge._2()._2().equals("u"))
            .join(userUserWeightsSum);



        JavaPairRDD<Tuple2<Integer, String>, Double> postWeightsSum = edgeRDD
            .filter(edge -> edge._1()._1()._2().equals("p")) 
            .mapToPair(edge -> {
                Tuple2<Tuple2<Integer, String>, Tuple2<Integer, String>> key = edge._1();
                Integer value = edge._2();
                return new Tuple2<>(key._1(), value);
            })
            .reduceByKey(Integer::sum)
            .mapToPair(tuple -> new Tuple2<>(tuple._1(), 1.0 / tuple._2())); 

        JavaPairRDD<Tuple2<Integer, String>, Tuple2<Tuple2<Integer, String>, Double>> postEdges = networkRDD
            .filter(edge -> edge._1()._2().equals("p"))
            .join(postWeightsSum);


        
         JavaPairRDD<Tuple2<Integer, String>, Double> hashtagWeightsSum = edgeRDD
            .filter(edge -> edge._1()._1()._2().equals("h")) 
            .mapToPair(edge -> {
                Tuple2<Tuple2<Integer, String>, Tuple2<Integer, String>> key = edge._1();
                Integer value = edge._2();
                return new Tuple2<>(key._1(), value);
            })
            .reduceByKey(Integer::sum)
            .mapToPair(tuple -> new Tuple2<>(tuple._1(), 1.0 / tuple._2())); 

        JavaPairRDD<Tuple2<Integer, String>, Tuple2<Tuple2<Integer, String>, Double>> hashtagEdges = networkRDD
            .filter(edge -> edge._1()._2().equals("h"))
            .join(hashtagWeightsSum);


        
        JavaPairRDD<Tuple2<Integer, String>, Tuple2<Tuple2<Integer, String>, Double>> combinedEdges = userHashtagEdges
            .union(userPostEdges)
            .union(userUserEdges)
            .union(postEdges)
            .union(hashtagEdges);


        combinedEdges.foreach(edge -> System.out.println(edge));

        return combinedEdges;
    }  


    /**
     * run algorithm
     */
    private JavaPairRDD<Tuple2<Integer, String>,Tuple2<Integer, Double>> adsorptionPropagation(JavaPairRDD<Tuple2<Integer, String>, Tuple2<Tuple2<Integer, String>, Double>> edgeRDD,
                                   JavaRDD<Integer> usersRDD) {
        
        JavaPairRDD<Tuple2<Integer, String>, Tuple2<Integer, Double>> userLabelsMapped = usersRDD
                .mapToPair(user -> new Tuple2<>(new Tuple2<>(user, "u"), new Tuple2<>(user, 1.0)));

        JavaPairRDD<Tuple2<Integer,String>, Tuple2<Integer, Double>> vertexLabels = userLabelsMapped;
        
        int i = 0;
        double d_max = .1;
        while (i < 100) {
            i = i +1 ;
            //propogate labels ie for each label move across an edge so edgeRDD.join labels then multiple the edge._2._1 weight times the label weight label._2() and store in new tuple <edge._2._1,
            JavaPairRDD<Tuple2<Integer, String>, Tuple2<Integer, Double>> propagatedVertexLabels = vertexLabels
                .join(edgeRDD)
                .mapToPair(pair -> {
                    Tuple2<Integer, Double> label = pair._2()._1();
                    Tuple2<Tuple2<Integer, String>, Double> edge = pair._2()._2();
                    
                    Tuple2<Integer, String> vertex = edge._1();
                    Double edgeWeight = edge._2();
                    Double labelWeight = label._2();
                    Double propagatedWeight = edgeWeight * labelWeight;
                    Integer userLabel = label._1(); 
                    return new Tuple2<>(new Tuple2<>(vertex, userLabel), propagatedWeight);
                })
                .reduceByKey(Double::sum) //get sum for a given vertex and user
                .mapToPair(pair -> new Tuple2<>(pair._1()._1(), new Tuple2<>(pair._1()._2(), pair._2())));

            //normalize get sum of all labels for vertex
            JavaPairRDD<Tuple2<Integer, String>, Double> sumsByVertex = propagatedVertexLabels
                .mapValues(tuple -> tuple._2()) 
                .reduceByKey(Double::sum);

            propagatedVertexLabels = propagatedVertexLabels
                .join(sumsByVertex) 
                .mapValues(pair -> {
                    Double value = pair._1()._2(); 
                    Double sum = pair._2(); 
                    Double normalizedValue = value / sum; 
                    return new Tuple2<>(pair._1()._1(), normalizedValue); 
                });
            

            propagatedVertexLabels = propagatedVertexLabels
                .mapToPair(pair -> {
                    Tuple2<Integer, String> key = pair._1();
                    Tuple2<Integer, Double> value = pair._2();

                    if (key._2().equals("u") && key._1().equals(value._1())) {
                        return new Tuple2<>(key, new Tuple2<>(value._1(), 1.0));
                    } else {
                        return pair;
                    }
                });


        
            JavaPairRDD<Tuple2<Integer, String>,Tuple2<Integer, Double>> entriesToAdd = userLabelsMapped
                .subtractByKey(propagatedVertexLabels);
            propagatedVertexLabels = propagatedVertexLabels
                .union(entriesToAdd);

            JavaPairRDD<Tuple2<Integer, String>, Double> differences = propagatedVertexLabels.join(vertexLabels)
                        .mapValues(tuple -> Math.abs(tuple._1._2 - tuple._2._2));
            Double maxDifference = differences.values().max(Comparator.naturalOrder());
            System.out.println("MaxDifference: " + maxDifference);
            vertexLabels = propagatedVertexLabels;
            if (maxDifference <= d_max){
                break;
            }
        }


        vertexLabels.foreach(edge -> System.out.println(edge));
        return vertexLabels;
    }  


    /**
     * Create tables for social network recommendations and clear existing data.
     */
    public void createAndClearTables() {
        try (Connection connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                Config.DATABASE_PASSWORD)) {
            try (Statement statement = connection.createStatement()) {
                // Create table for social network friend recommendations if not exists
                statement.execute("CREATE TABLE IF NOT EXISTS socialNetworkFriendRecommendations ( " +
                        "userID INT, " +
                        "userLabelID INT, " +
                        "weight DOUBLE, " +
                        "FOREIGN KEY (userID) REFERENCES users(id), " +
                        "FOREIGN KEY (userLabelID) REFERENCES userLabels(id) " +
                        ")");
                
                // Create table for social network hashtag recommendations if not exists
                statement.execute("CREATE TABLE IF NOT EXISTS socialNetworkHashtagRecommendations ( " +
                        "userLabelID INT, " +
                        "hashtagID INT, " +
                        "weight DOUBLE, " +
                        "FOREIGN KEY (userLabelID) REFERENCES userLabels(id), " +
                        "FOREIGN KEY (hashtagID) REFERENCES hashtags(id) " +
                        ")");
                
                // Create table for social network post recommendations if not exists
                statement.execute("CREATE TABLE IF NOT EXISTS socialNetworkPostRecommendations ( " +
                        "userLabelID INT, " +
                        "postID INT, " +
                        "weight DOUBLE, " +
                        "FOREIGN KEY (userLabelID) REFERENCES userLabels(id), " +
                        "FOREIGN KEY (postID) REFERENCES posts(post_id) " +
                        ")");
            }

            // Clear existing data from tables
            try (Statement clearStatement = connection.createStatement()) {
                clearStatement.execute("DELETE FROM socialNetworkFriendRecommendations");
                clearStatement.execute("DELETE FROM socialNetworkHashtagRecommendations");
                clearStatement.execute("DELETE FROM socialNetworkPostRecommendations");
            }

        } catch (SQLException e) {
            logger.error("Error creating and clearing tables: " + e.getMessage(), e);
        }
    }
 
    /**
     * Send back to database
     */
    public void sendResultsToDatabase(JavaPairRDD<Tuple2<Integer, String>,Tuple2<Integer, Double>> vertexLabelRankings) {
        try (Connection connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                Config.DATABASE_PASSWORD)) {
    
       
        createAndClearTables();
        //then go through vertexLabel rankings and filter for where ._2 in key is a "h" and then add these to database
        vertexLabelRankings.foreach(vertexLabelRanking -> {
            try {
                PreparedStatement stmt;
                if (vertexLabelRanking._1()._2().equals("h")) {
                    stmt = connection.prepareStatement(
                        "INSERT INTO socialNetworkHashtagRecommendations (userLabelID, hashtagID, weight) VALUES (?, ?, ?)");
                } else if (vertexLabelRanking._1()._2().equals("p")) {
                    stmt = connection.prepareStatement(
                        "INSERT INTO socialNetworkPostRecommendations (userLabelID, postID, weight) VALUES (?, ?, ?)");
                } else if (vertexLabelRanking._1()._2().equals("f")) {
                    stmt = connection.prepareStatement(
                        "INSERT INTO socialNetworkFriendRecommendations (userLabelID, friendID, weight) VALUES (?, ?, ?)");
                } else {
                    return; // Skip this entry
                }

                stmt.setInt(1, vertexLabelRanking._1()._1());
                stmt.setInt(2, vertexLabelRanking._2()._1());
                stmt.setDouble(3, vertexLabelRanking._2()._2());
                stmt.executeUpdate();
            } catch (SQLException e) {
                logger.error("Error inserting data: " + e.getMessage(), e);
            }
        });


        } catch (SQLException e) {
            logger.error("Error sending recommendations to database: " + e.getMessage(), e);
        }
    }

    /**
     * Write the recommendations to a CSV file. 
     */
    public void writeResultsCsv(JavaPairRDD<Tuple2<Integer, String>, Tuple2<Integer, Double>> vertexLabelRankings) {
        // Create a new file to write the recommendations to
        File file = new File("vertexLabelRankings.csv");
        try (PrintWriter writer = new PrintWriter(file)) {
            // Write the header
            writer.println("vertex_id,type,user_id,weight");

            // Write the recommendations to the file
            vertexLabelRankings.foreach(vertexLabelRanking -> {
                writer.println(vertexLabelRanking._1()._1() + "," + vertexLabelRanking._1()._2() + "," + vertexLabelRanking._2()._1() + "," + vertexLabelRanking._2()._2());
            });
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

        // Get users RDD for user labels and weights
        JavaRDD<Integer> usersRDD = getUsersFromJDBC();

        // Friend-of-a-Friend Recommendation Algorithm:
        JavaPairRDD<Tuple2<Integer, String>, Tuple2<Tuple2<Integer, String>, Double>> edgeRDD = computeEdgeRDD(network);

        // Run the adsorption propagation algorithm
        JavaPairRDD<Tuple2<Integer, String>,Tuple2<Integer, Double>> vertexLabelRankings = adsorptionPropagation(edgeRDD, usersRDD);

        logger.info("*** Finished Adsorption! ***");

        sendResultsToDatabase(vertexLabelRankings);
        writeResultsCsv(vertexLabelRankings);

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
        final runSocialNetwork fofs = new runSocialNetwork();
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
