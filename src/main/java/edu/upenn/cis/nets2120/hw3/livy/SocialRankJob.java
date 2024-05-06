package edu.upenn.cis.nets2120.hw3.livy;

import java.io.IOException;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;

import org.apache.livy.JobContext;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;

import edu.upenn.cis.nets2120.config.Config;
import edu.upenn.cis.nets2120.hw3.SparkJob;
import scala.Tuple2;
import java.util.*;
import java.util.stream.Collectors;

public class SocialRankJob extends SparkJob<List<MyPair<String, Double>>> {
    /**
     *
     */
    private static final long serialVersionUID = 1L;

    private boolean useBacklinks;
    // Convergence condition variables
    protected double d_max; // largest change in a node's rank from iteration i to iteration i+1
    protected int i_max; // max number of iterations

    private String source;

    int max_answers = 10;

    public SocialRankJob(double d_max, int i_max, int answers, boolean useBacklinks, boolean debug) {
        super(false, false, debug);
        this.useBacklinks = useBacklinks;
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
    protected JavaPairRDD<String, String> getSocialNetwork(String filePath) {
        JavaRDD<String> file = context.textFile(filePath, Config.PARTITIONS);

        // TODO Your code from ComputeRanks here        //  Use the .distinct() function to eliminate duplicates
        JavaPairRDD<String, String> followerFollowed = file.mapToPair(line -> {
            String[] parts = line.split("\\s+"); // Split by one or more whitespace characters
            // Assuming each line has two parts separated by either space or tab
            return new Tuple2<>(parts[0], parts[1]);
        });

        JavaPairRDD<String, String> result = followerFollowed.mapToPair(pair -> new Tuple2<>(pair._2(), pair._1()));

        long numNodes = result.keys().distinct().count();

        // Count the number of edges
        long numEdges = result.count();

        //System.out.println("There are" + numNodes + "nodes and " + numEdges + " edges");
        return result;
    }

    /**
     * Retrieves the sinks from the given network.
     *
     * @param network the input network represented as a JavaPairRDD
     * @return a JavaRDD containing the nodes with no outgoing edges (sinks)
     */
    protected JavaRDD<String> getSinks(JavaPairRDD<String, String> network) {
        // TODO Your code from ComputeRanks here
        JavaRDD<String> secondStrings = network.map(Tuple2::_2);
        JavaPairRDD<String, Integer> dummySecondStrings = secondStrings.mapToPair(s -> new Tuple2<>(s, 1));
        JavaPairRDD<String, String> sinksAndFollower = network.subtractByKey(dummySecondStrings);
        JavaRDD<String> result = sinksAndFollower.keys().distinct();
        //long count = result.count();
        //System.err.println("There are" + count + "sinks");
        return result;
    }

    /**
     * Main functionality in the program: read and process the social network
     * Runs the SocialRankJob and returns a list of the top 10 nodes with the highest SocialRank values.
     *
     * @param debug a boolean indicating whether to enable debug mode
     * @return a list of MyPair objects representing the top 10 nodes with their corresponding SocialRank values
     * @throws IOException          if there is an error reading the social network file
     * @throws InterruptedException if the execution is interrupted
     */
    public List<MyPair<String, Double>> run(boolean debug) throws IOException, InterruptedException {
        //System.err.println("Running");

        // Load the social network, aka. the edges (followed, follower)
        JavaPairRDD<String, String> edgeRDD = getSocialNetwork(Config.SOCIAL_NET_PATH).distinct();

        // Find the sinks in edgeRDD as PairRDD
        JavaRDD<String> sinks = getSinks(edgeRDD);
        //new java.io.FileWriter("/nets2120/homework-3-ms2-cbos558/results-of-social-rank-job.txt", true).append("there are\n" + sinks.count() + "\n").close();
        //System.err.println("There are " + sinks.count() + " sinks");

        // Create a dummy value pair for sinks RDD for joining purposes
        JavaPairRDD<String, Integer> dummySinks = sinks.mapToPair(s -> new Tuple2<>(s, 1));
        // TODO Add backlinks, perform SocialRank calculations until convergence, then
        // output top 1000 nodes
        // Join edgeRDD with dummySinks RDD to filter edgeRDD based on matching keys
        //< followed, follower> 
        //<follower,

                // Extract the keys from backlinksAdded RDD
        if (useBacklinks) {
        // compute nodeTransferRdd
            JavaPairRDD<String, String> filteredEdgeRDD = edgeRDD.join(dummySinks)
                                                           .mapToPair(pair -> new Tuple2<>(pair._1(), pair._2()._1()));
            JavaPairRDD<String, String> backlinks = filteredEdgeRDD.mapToPair(pair -> new Tuple2<>(pair._2(), pair._1()));
            edgeRDD = backlinks.union(edgeRDD);
        } 
        JavaPairRDD<String, String> followerToFollowed = edgeRDD.mapToPair(pair -> new Tuple2<>(pair._2(), pair._1()));
        JavaRDD<String> distinctKeys = edgeRDD.keys().distinct();
        
        
        // followerToFollowed
        JavaRDD<String> distinctKeysSources = followerToFollowed.keys().distinct();
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
            // then sum them up and save into social rank temp
            socialRank = propogateRDD1.reduceByKey((x, y) -> x + y);

            // apply decay factor
            socialRank = socialRank.mapValues(value -> value * (1 - decay));
            socialRank = socialRank.mapValues(value -> value + decay);
            // Find missing keys in social rank ( the sources )
            JavaPairRDD<String, Double> missingKeys = socialRankPrev.subtractByKey(socialRank)
            .mapValues(value -> 0.15);  
            socialRank = socialRank.union(missingKeys);
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
                //socialRank = socialRankTemp;
                break;
            } else {
                socialRankPrev = socialRank;
            }
        }
        JavaPairRDD<Double, String> socialRankRev = socialRank.mapToPair(pair -> new Tuple2<>(pair._2(), pair._1()));
        JavaPairRDD<Double, String> socialRankRevSorted = socialRankRev.sortByKey(false);
        List<Tuple2<Double, String>> resultTuple2 = socialRankRevSorted.take(max_answers);
        // Convert Tuple2<String, Double> to MyPair<String, Double>
        List<MyPair<String, Double>> result = resultTuple2.stream()
            .map(tuple -> new MyPair<>(tuple._2(), tuple._1()))
            .collect(Collectors.toList());

        return result;
    }
    @Override
    public List<MyPair<String, Double>> call(JobContext arg0) throws Exception {
        initialize();
        return run(false);
    }

}
