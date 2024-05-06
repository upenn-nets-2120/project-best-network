package project.bestnetwork.livy;

import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintStream;
import java.net.URISyntaxException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import project.bestnetwork.SparkJob;

import scala.Tuple2;


public class ComputeRanksLivy {
    static Logger logger = LogManager.getLogger(ComputeRanksLivy.class);

    public static void main(String[] args)
            throws IOException, URISyntaxException, InterruptedException, ExecutionException {
        // Check so we'll fatally exit if the environment isn't set
        if (System.getenv("LIVY_HOST") == null) {
            logger.error("LIVY_HOST not set -- update your .env and run source .env");
            System.exit(-1);
        }
        boolean debug = false;

        // String livy = SparkJob.getLivyUrl(args);


        // SocialRankJob blJob = new SocialRankJob(d_max, i_max, 1000, true, debug);

        // List<MyPair<String, Double>> backlinksResult = SparkJob.runJob(livy, blJob);
      
        // out.print("Hey julia!");
            

       
            // logger.error("Error writing to file: " + e.getMessage());
        
        

        // logger.info("*** Finished social network ranking! ***");

    }

}
