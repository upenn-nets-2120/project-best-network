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

import project.config.Config;
import project.bestnetwork.SparkJob;
import scala.Tuple2;

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
     * Fetch the social network from the S3 path, and create a (followed, follower)
     * edge graph
     *
     * @param filePath
     * @return JavaPairRDD: (followed: String, follower: String)
     */
    protected JavaPairRDD<String, String> getSocialNetwork(String filePath) {
        JavaRDD<String> file = context.textFile(filePath, Config.PARTITIONS);

        // TODO Load the file filePath into an RDD (take care to handle both spaces and
        // tab characters as separators)

        //Map each line to a new Pair
        JavaPairRDD<String, String> socialNetwork = file.mapToPair(line -> {
            String[] parts = line.split("[\\s\\t]+"); // regex = split by space or tab
            return new Tuple2<>(parts[1], parts[0]); // (followed, follower)
        }).distinct();

        return socialNetwork;
    }

    /**
     * Retrieves the sinks from the given network.
     *
     * @param network the input network represented as a JavaPairRDD
     * @return a JavaRDD containing the nodes with no outgoing edges (sinks)
     */
    protected JavaRDD<String> getSinks(JavaPairRDD<String, String> network) {
        // TODO Your code from ComputeRanks here

        //using subtract

        JavaRDD<String> nodes = network.flatMap(tuple -> {
            Set<String> nodes2 = new HashSet<>(); //we do this way bc flatmap expects iterable set of elements
            nodes2.add(tuple._1()); // Add followed
            nodes2.add(tuple._2()); // Add follower
            return nodes2.iterator();
        }).distinct();

        //this contains all nonsink nodes
        JavaRDD<String> nonsinks = network.flatMap(tuple -> {
            Set<String> nodes2 = new HashSet<>(); //we do this way bc flatmap expects iterable set of elements
            nodes2.add(tuple._2()); // Add follower
            return nodes2.iterator();
        }).distinct();


        return nodes.subtract(nonsinks);
    }



    public List<MyPair<String, Double>> run(boolean debug) throws IOException, InterruptedException {
        System.err.println("Running");

      
       
       

      return new ArrayList<>();
    }

    @Override
    public List<MyPair<String, Double>> call(JobContext arg0) throws Exception {
        initialize();
        return run(false);
    }

    /**
     *    Initialize the SocialRank with a value of 1 at all nodes.
          Use a decay factor of .15
          Compute the SocialRank after either the largest change in a node's rank from iteration
              i to iteration i + 1 is d_max or after i_max iterations have passed
     */

    static JavaPairRDD<String, Double> getSocialRank(JavaPairRDD<String, String> edgeRDD, double dMax, int iMax, boolean debug) {

        int i = 1; // keeps track of what iteration we are on
        final boolean[] finalPassedDMax = {false};
        
        System.err.println("Spark Context: " + edgeRDD.context().toString());

        // ranks initialzed to 1
        JavaPairRDD<String, Double> ranks = edgeRDD.keys().distinct().mapToPair(vertex -> new Tuple2<>(vertex, 1.0));
        System.err.println("Spark Context Rank: " + ranks.context().toString());


        //edgerdd is followed, follower -> sum of occurences of how many times a node appears as a follower is the outdegree
        JavaPairRDD<String, Integer> outDegrees = edgeRDD.mapToPair(edge -> new Tuple2<>(edge._2(), 1)).reduceByKey(Integer::sum);
        System.err.println("outDegrees: " + outDegrees.collect());
        System.err.println("Spark Context Outdegrees: " + outDegrees.context().toString());





        while (true) {
            //edgeRdd = (followed, follower)
            // for each node - calculate contributions from the in-neighbors
            JavaPairRDD<String, Double> contributions = edgeRDD.mapToPair(edge -> new Tuple2<>(edge._2(), edge._1()))
                    .join(ranks)
                    //edges in form followed, follower originally. we join this w/ ranks so we have {follower, (followed, follower node's rank)}
                    .join(outDegrees)
                    //now this is {follower, {(followed, follower node's rank), follwer node's outdegree}
                    .mapToPair(pair -> {
                        String follower = pair._1();
                        String followed = pair._2()._1()._1();
                        double followerRank = pair._2()._1()._2();
                        int followerOutdegree = pair._2()._2();
                        //this tuple is {followed, 1/outdegree * follower's rank}
                        return new Tuple2<>(followed, 1.0 / followerOutdegree * followerRank);
                    })
                    .reduceByKey(Double::sum);

            // Update ranks using the SocialRank formula
            JavaPairRDD<String, Double> newRanks = ranks.join(contributions)
                //after this join -> {followed node, (old rank, new contribution)}
                    .mapToPair(pair -> {
                        String node = pair._1();
                        double oldRank = pair._2()._1();
                        double contributionSum = pair._2()._2();
                        double newRank = .15 + (1 - .15) * contributionSum;
                         
                        /** 
                        if (Math.abs(newRank - oldRank) >= dMax) {
                            finalPassedDMax[0] = true;
                        }
                        */
                        
                        return new Tuple2<>(node, newRank);
                    });
            
            // Calculate the maximum difference between newRank and oldRank 
            
            Double maxDiff = newRanks.join(ranks)
                //{node, (new rank, old rank)}
                .map(pair -> {
                    String node = pair._1();
                    double newRank = pair._2()._1();
                    double oldRank = pair._2()._2();
                    
                    // Calculate the difference between newRank and oldRank
                    double difference = Math.abs(newRank - oldRank);
                    
                    return difference;
                })
                .reduce(Math::max);
            



            if (debug) {
                System.out.println("Iteration " + i + ":");
                newRanks.foreach(tuple -> System.out.println(tuple._1() + ": " + tuple._2()));
            }
            System.out.println("Iteration " + i + ":");
            //System.out.println(maxDiff);
            System.out.println(dMax);


            ranks = newRanks;

            //check if we should stop now - i >= imax or dmax condition
            if (i >= iMax || maxDiff < dMax) {
                return ranks;
            }


            i++;

        }
    }

}
