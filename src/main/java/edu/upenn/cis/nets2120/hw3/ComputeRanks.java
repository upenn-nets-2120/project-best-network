package edu.upenn.cis.nets2120.hw3;

import java.io.IOException;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;
import java.util.stream.Collectors;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;

import edu.upenn.cis.nets2120.config.Config;

import scala.Tuple2;

import java.util.*;
import java.lang.Math;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class ComputeRanks extends SparkJob<List<Tuple2<String, Double>>> {
    /**
     * The basic logger
     */
    static Logger logger = LogManager.getLogger(ComputeRanks.class);

    // Convergence condition variables
    protected double d_max; // largest change in a node's rank from iteration i to iteration i+1
    protected int i_max; // max number of iterations
    int max_answers = 10;

    public ComputeRanks(double d_max, int i_max, int answers, boolean debug) {
        super(true, true, debug);
        this.d_max = d_max;
        this.i_max = i_max;
        this.max_answers = answers;
    }

    /**
     * Fetch the social network from the S3 path, and create a (followed, follower)
     * edge graph
     *
     * @param filePath
     * @return JavaPairRDD: (followed: String, follower: String)
     */
    protected JavaPairRDD<String, String> getSocialNetwork() {
        if (System.getenv("RDS_HOSTNAME") != null) {
            try {
                Class.forName("org.mysql .Driver");
                Connection connection = null;
                try {
                    connection = DriverManager.getConnection(System.getenv("RDS_CONNECTION"), System.getenv("RDS_USER"),
                    System.getenv("RDS_PWD"));
                } catch (SQLException e) {
                    logger.error("Connection to database failed: " + e.getMessage(), e);
                    logger.error("Please make sure the RDS server is correct, the tunnel is enabled, and you have run the mysql command to create the database.");
                    System.exit(1);
                }

                logger.trace("Getting remote connection with connection string from environment variables.");
                // Read data from RDS using Spark
                Dataset<Row> df = spark.read().jdbc(jdbcUrl, "friends", connectionProperties);
                logger.info("Remote connection successful.");
            }
                catch (ClassNotFoundException e) { logger.warn(e.toString());}
                catch (SQLException e) { logger.warn(e.toString());}
        }
        
        // tab characters as separators)
        // Split each line string in file by space or tab characters
        // Step 1: Convert Dataset<Row> to RDD<Tuple2<String, String>>
        JavaRDD<Tuple2<String, String>> rdd = df.toJavaRDD().map(row ->
        new Tuple2<>(row.getString(0), row.getString(1))
        );

        // Step 2: Convert RDD<Tuple2<String, String>> to JavaPairRDD<String, String>
        JavaPairRDD<String, String> pairRDD = JavaPairRDD.fromJavaRDD(rdd);

        JavaPairRDD<String, String> result = pairRDD.mapToPair(pair -> new Tuple2<>(pair._2(), pair._1()));

        long numNodes = result.keys().distinct().count();

        // Count the number of edges
        long numEdges = result.count();
        logger.info("There are {} nodes and {} edges", numNodes, numEdges);
        return result;
    }

    /**
     * Retrieves the sinks in the provided graph.
     *
     * @param network The input graph represented as a JavaPairRDD.
     * @return A JavaRDD containing the nodes with no outgoing edges.
     */
    protected JavaRDD<String> getSinks(JavaPairRDD<String, String> network) {
        // TODO Find the sinks in the provided graph
        // network provided is followed , follower so get all followers
        JavaRDD<String> secondStrings = network.map(Tuple2::_2);
        // 
        JavaPairRDD<String, Integer> dummySecondStrings = secondStrings.mapToPair(s -> new Tuple2<>(s, 1));
        // sinks are those who do not follow
        JavaPairRDD<String, String> sinksAndFollower = network.subtractByKey(dummySecondStrings);
        JavaRDD<String> result = sinksAndFollower.keys().distinct();
        return result;
    }

    /**
     * Main functionality in the program: read and process the social network
     * Runs the SocialRank algorithm to compute the ranks of nodes in a social network.
     *
     * @param debug a boolean value indicating whether to enable debug mode
     * @return a list of tuples containing the node ID and its corresponding SocialRank value
     * @throws IOException          if there is an error reading the social network data
     * @throws InterruptedException if the execution is interrupted
     */
    public List<Tuple2<String, Double>> run(boolean debug) throws IOException, InterruptedException {
        System.out.println("running!");
        // Load the social network, aka. the edges (followed, follower)
        //JavaPairRDD<String, String> edgeRDD = getSocialNetwork(Config.SOCIAL_NET_PATH);
        String filePath = Config.SOCIAL_NET_PATH;
        //String filePath = "src/main/java/edu/upenn/cis/nets2120/hw3/simple-example.txt";
        //String filePath = "s3a://penn-cis545-files/movie_friends.txt";
        // followed to followers
        JavaPairRDD<String, String> edgeRDD = getSocialNetwork().distinct();

        // Find the sinks in edgeRDD as PairRDD
        JavaRDD<String> sinks = getSinks(edgeRDD);
        System.out.println("there are this many sinks!" + sinks);
        logger.info("There are {} sinks", sinks.count());
        // Create a dummy value pair for sinks RDD for joining purposes
        JavaPairRDD<String, Integer> dummySinks = sinks.mapToPair(s -> new Tuple2<>(s, 1));
        // TODO Add backlinks, perform SocialRank calculations until convergence, then
        // output top 1000 nodes
        // Join edgeRDD with dummySinks RDD to filter edgeRDD based on matching keys
        JavaPairRDD<String, String> filteredEdgeRDD = edgeRDD.join(dummySinks)
                                                           .mapToPair(pair -> new Tuple2<>(pair._1(), pair._2()._1()));
        JavaPairRDD<String, String> backlinks = filteredEdgeRDD.mapToPair(pair -> new Tuple2<>(pair._2(), pair._1())).distinct();
        logger.info("There are {} backlinkes added", backlinks.count());
        JavaPairRDD<String, String> backlinksAdded = backlinks.union(edgeRDD);
        // Extract the keys from backlinksAdded RDD
        //coming from followed <- follower 
        // compute nodeTransferRdd
        JavaPairRDD<String, String> followerToFollowed = backlinksAdded.mapToPair(pair -> new Tuple2<>(pair._2(), pair._1()));
        //followerToFollowed.foreach(pair -> System.out.println(pair._1() + ": " + pair._2()));
        JavaRDD<String> distinctKeys = backlinksAdded.keys().distinct();
        // followerToFollowed
        JavaRDD<String> distinctKeysSources = followerToFollowed.keys().distinct();
        //System.out.println("sources");
        distinctKeys = distinctKeys.union(distinctKeysSources).distinct();
        JavaPairRDD<String, Double> nodeTransferRdd0 = followerToFollowed.mapToPair(pair -> new Tuple2<>(pair._1(), 1.0));
        JavaPairRDD<String, Double> nodeTransferRdd1 = nodeTransferRdd0.reduceByKey((x, y) -> x + y);
        //nodeTransferRdd1.foreach(pair -> System.out.println(pair._1() + ": " + pair._2()));
        // Convert Map to JavaPairRDD<String, Double>
        // nodes and how many outgoing edges
        JavaPairRDD<String, Double> nodeTransferRdd2 = nodeTransferRdd1.mapValues(value -> 1.0 / value);
        // edgeTransferRDD <source, <target, weight>
        
        JavaPairRDD<String, Tuple2<String, Double>> edgeTransferRDD = followerToFollowed.join(nodeTransferRdd2);
        // initalize socialRank
        JavaPairRDD<String, Double> socialRank = distinctKeys.mapToPair(key -> new Tuple2<>(key, 1.0));
        JavaPairRDD<String, Double> socialRankPrev = distinctKeys.mapToPair(key -> new Tuple2<>(key, 1.0));
        double decay = 0.15;
        // TODO: add r value and also check for 
        for (int i = 0; i < i_max; i++) {
            // do a joing first to get <source, <<target, weight>, rank> 
            JavaPairRDD<String, Tuple2<Tuple2<String, Double>, Double>> propogateRDD0 = edgeTransferRDD.join(socialRank);
            // then get <target, weight * rank>
            JavaPairRDD<String, Double> propogateRDD1 = propogateRDD0.mapToPair(pair -> {
                String target = pair._2()._1()._1();
                Double weight = pair._2()._1()._2();
                Double rank = pair._2()._2();
                return new Tuple2<>(target, weight * rank);
            });
            // add sources 

            // then sum them up and save into social rank temp
            socialRank = propogateRDD1.reduceByKey((x, y) -> x + y);

            // apply decay factor
            socialRank = socialRank.mapValues(value -> value * (1 - decay));
            socialRank = socialRank.mapValues(value -> value + decay);
            // Find missing keys in social rank ( the sources )
            JavaPairRDD<String, Double> missingKeys = socialRankPrev.subtractByKey(socialRank)
            .mapValues(value -> 0.15);
            socialRank = socialRank.union(missingKeys);
            //socialRank.foreach(pair -> System.out.println(pair._1() + ": " + pair._2()));
            // check if largest change is less than d_max
            JavaPairRDD<String, Tuple2<Double, Double>> socialRankJoined = socialRank.join(socialRankPrev);
            JavaPairRDD<String, Double> socialRankDiff = socialRankJoined.mapToPair(pair -> {
                String node = pair._1();
                Double oldVal = pair._2()._1();
                Double newVal = pair._2()._2();
                return new Tuple2<>(node, Math.abs(oldVal - newVal));
            });
            JavaPairRDD<Double, String> sortedSocialRankDiff0 = socialRankDiff.mapToPair(pair -> new Tuple2<> (pair._2(), pair._1()));
            JavaPairRDD<Double, String> sortedSocialRankDiff1 = sortedSocialRankDiff0.sortByKey(false);
            Tuple2<Double, String> firstElement = sortedSocialRankDiff1.first();
            
            if (firstElement._1() < d_max) {
                //System.out.println("it is" + firstElement._1());
                break;
            } else {
                //System.out.println("keep going");
                socialRankPrev = socialRank;
            }
        }
        JavaPairRDD<Double, String> socialRankRev = socialRank.mapToPair(pair -> new Tuple2<>(pair._2(), pair._1()));
        JavaPairRDD<Double, String> socialRankRevSorted = socialRankRev.sortByKey(false);
        List<Tuple2<String, Double>> result = socialRankRevSorted.take(max_answers)
                .stream()
                .map(tuple -> new Tuple2<>(tuple._2(), tuple._1()))
                .collect(Collectors.toList());
        return result;
    }
}
