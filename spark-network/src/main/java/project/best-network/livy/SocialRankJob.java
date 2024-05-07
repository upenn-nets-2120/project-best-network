package project.bestnetwork.livy;

import java.io.IOException;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import java.io.FileWriter;
import java.util.*;


import org.apache.livy.JobContext;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.SparkSession;

import project.config.Config;
import project.bestnetwork.SparkJob;
import scala.Tuple2;


import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.*;

import project.config.Config;
import project.storage.SparkConnector;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;



public class SocialRankJob extends SparkJob<List<MyPair<String, Double>>> {
    /**
     *
     */
    private static final long serialVersionUID = 1L;



    private String source;


    public SocialRankJob(boolean debug) {
        super(false, false, debug);
    }

    /**
     * get network
     */
    public JavaPairRDD<Tuple2<Integer, String>, Tuple2<Integer, String>> getSocialNetworkFromJDBC() {
        try {
            Connection connection = null;

            try {
                connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                        Config.DATABASE_PASSWORD);
            } catch (SQLException e) {
                System.exit(1);
            }

            if (connection == null) {
                System.exit(1);
            }


            List<Tuple2<Tuple2<Integer, String>, Tuple2<Integer, String>>> networkList = new ArrayList<>();
            
            
            // // SQL query to select users and their posts where parent_post is NULL
            // String userPostSql = "SELECT l.userID, l.postID " +
            //          "FROM likeToPost l " +
            //          "JOIN posts p ON l.postID = p.post_id " +
            //          "WHERE p.parent_post IS NULL";

            // Statement userPostStmt = connection.createStatement();
            // ResultSet userPostResultSet = userPostStmt.executeQuery(userPostSql);
            // while (userPostResultSet.next()) {
            //     int user_id = userPostResultSet.getInt("userID");
            //     int post_id = userPostResultSet.getInt("postID");
            //     networkList.add(new Tuple2<>(new Tuple2<>(user_id, "u"), new Tuple2<>(post_id, "p")));
            //     networkList.add(new Tuple2<>(new Tuple2<>(post_id, "p"), new Tuple2<>(user_id, "u")));
            // }
            // userPostResultSet.close();
            // userPostStmt.close();

            // // SQL query to select users and hashtags they are interested in
            // String userHashtagSql = "SELECT userID, hashtagID " +
            //                         "FROM hashtagInterests";
            // Statement userHashtagStmt = connection.createStatement();
            // ResultSet userHashtagResultSet = userHashtagStmt.executeQuery(userHashtagSql);
            // while (userHashtagResultSet.next()) {
            //     int user_id = userHashtagResultSet.getInt("userID");
            //     int hashtag_id = userHashtagResultSet.getInt("hashtagID");
            //     networkList.add(new Tuple2<>(new Tuple2<>(user_id, "u"), new Tuple2<>(hashtag_id, "h")));
            //     networkList.add(new Tuple2<>(new Tuple2<>(hashtag_id, "h"), new Tuple2<>(user_id, "u")));
            // }
            // userHashtagResultSet.close();
            // userHashtagStmt.close();

            // // SQL query to select posts and hashtags associated with them
            // String postHashtagSql = "SELECT post_id, hashtag_id " +
            //                         "FROM post_to_hashtags";

            // Statement postHashtagStmt = connection.createStatement();
            // ResultSet postHashtagResultSet = postHashtagStmt.executeQuery(postHashtagSql);
            // while (postHashtagResultSet.next()) {
            //     int post_id = postHashtagResultSet.getInt("post_id");
            //     int hashtag_id = postHashtagResultSet.getInt("hashtag_id");
            //     networkList.add(new Tuple2<>(new Tuple2<>(post_id, "p"), new Tuple2<>(hashtag_id, "h")));
            //     networkList.add(new Tuple2<>(new Tuple2<>(hashtag_id, "h"), new Tuple2<>(post_id, "p")));
            // }
            // postHashtagResultSet.close();
            // postHashtagStmt.close();


            // // SQL query to select friends/followers
            // String friendsSql = "SELECT followed, follower FROM friends";

            // Statement friendsStmt = connection.createStatement();
            // ResultSet friendsResultSet = friendsStmt.executeQuery(friendsSql);
            // while (friendsResultSet.next()) {
            //     int followedUserId = friendsResultSet.getInt("followed");
            //     int followerUserId = friendsResultSet.getInt("follower");
            //     networkList.add(new Tuple2<>(new Tuple2<>(followedUserId, "u"), new Tuple2<>(followerUserId, "u")));
            // }
            // friendsResultSet.close();
            // friendsStmt.close();

            // Convert the list to JavaRDD and then to JavaPairRDD
            JavaRDD<Tuple2<Tuple2<Integer, String>, Tuple2<Integer, String>>> rdd = context.parallelize(networkList);
            JavaPairRDD<Tuple2<Integer, String>, Tuple2<Integer, String>> network = rdd.mapToPair(pair -> new Tuple2<>(pair._1(), pair._2()));

            // Show the result
            // network.foreach(pair -> System.out.println(pair._1() + " -> " + pair._2()));

            return network;

        } catch (Exception e) {
        }
        // Return a default value if the method cannot return a valid result
        return context.emptyRDD().mapToPair(x -> new Tuple2<>(new Tuple2<>(0, "default"), new Tuple2<>(0, "default")));

    }

    /**
     * get Users RDD for user labels and weights
     */
    public JavaRDD<Integer> getUsersFromJDBC() {
        try {
            Connection connection = null;

            try {
                connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                        Config.DATABASE_PASSWORD);
            } catch (SQLException e) {
                System.exit(1);
            }

            if (connection == null) {
                System.exit(1);
            }


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




    public List<MyPair<String, Double>> run(boolean debug) throws IOException, InterruptedException {
        System.err.println("Running");

      
        // // Load the social network:
        JavaPairRDD<Tuple2<Integer, String>, Tuple2<Integer, String>> network = getSocialNetworkFromJDBC();

        // // Get users RDD for user labels and weights
        // JavaRDD<Integer> usersRDD = getUsersFromJDBC();

        // // Friend-of-a-Friend Recommendation Algorithm:
        // JavaPairRDD<Tuple2<Integer, String>, Tuple2<Tuple2<Integer, String>, Double>> edgeRDD = computeEdgeRDD(network);

        // JavaPairRDD<Tuple2<Integer, String>, Tuple2<Integer, Double>> vertexLabels = adsorptionPropagation(edgeRDD, usersRDD);
        // List<Tuple2<Tuple2<Integer, String>, Tuple2<Integer, Double>>> vertexLabelsList = vertexLabels.collect();

        // List<MyPair<String, Double>> resultList = new ArrayList<>();
        // for (Tuple2<Tuple2<Integer, String>, Tuple2<Integer, Double>> tuple : vertexLabelsList) {
        //     MyPair<String, Double> pair = new MyPair<>(
        //         tuple._1()._2(), 
        //         tuple._2()._2() 
        //     );
        //     resultList.add(pair);
        // }
        // return resultList;
        return new ArrayList<>();
    }



    @Override
    public List<MyPair<String, Double>> call(JobContext arg0) throws Exception {
        initialize();
        return run(false);
    }

  

    static JavaPairRDD<Tuple2<Integer, String>, Tuple2<Integer, Double>> adsorptionPropagation(
        JavaPairRDD<Tuple2<Integer, String>, Tuple2<Tuple2<Integer, String>, Double>> edgeRDD,
        JavaRDD<Integer> usersRDD) {

        JavaPairRDD<Tuple2<Integer, String>, Tuple2<Integer, Double>> userLabelsMapped = usersRDD
                .mapToPair(user -> new Tuple2<>(new Tuple2<>(user, "u"), new Tuple2<>(user, 1.0)));

        JavaPairRDD<Tuple2<Integer,String>, Tuple2<Integer, Double>> vertexLabels = userLabelsMapped;
        
        int i = 0;
        double d_max = .1;
        while (i < 1) {
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
                    if (pair._1._2().equals("u") && pair._1._1().equals(pair._2._1())) {
                        return new Tuple2<>(pair._1(), new Tuple2<>(pair._2._1(), 1.0));
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

}
