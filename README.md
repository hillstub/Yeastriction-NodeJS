# Yeastriction webservice
Yeastriction is a tool to find CRISPR/Cas9 target sites in various yeast genomes. It first extracts all possible Cas9 target sequences (20 basepairs followed by NGG) from a specified ORF and from its complementary strand. Subsequently, sequences containing 6 or more Ts are discarded as this can terminate transcription (Braglia *et al.*, 2005; Wang *et al.*, 2008). Target sequences are then tested for off-targets (an off-target is defined as a sequence with either the NGG or NAG PAM sequence and 17 or more nucleotides identical to the original 20 bp target sequence (Hsu *et al.*, 2013)) by matching the sequences against the reference genome using Bowtie (version 1) (Langmead *et al.*, 2009). If any off-target is found the original target sequence is discarded. In a next step, the AT content is calculated for the target sequence. Using the RNAfold library (essentially with the parameters `--MEA --noLP –temp=30.`) (Lorenz *et al.*, 2011) the maximum expected accuracy structure of each RNA molecule is calculated. The target sequence is also searched for the presence of restriction sites based on a default list or a user-defined list. The targets can be ranked based on presence of restriction sites (1 for containing and 0 for lacking a restriction site), AT content (1 having the highest AT-content and 0 for the lowest AT-content) and secondary structure (1 having the lowest amount of pairing nucleotides and 0 for the highest number of nucleotides involved in secondary structures (indicated by brackets)). The range for every parameter is determined per locus and used to normalize the values. Subsequently, the target sequences are ranked by summation of the score for each parameter. These ranking scores should only be used to order the targets from a single locus and not to compare targets for different loci.

## Deploy your own CRISPR/Cas9 service
The tool is written in Javascript and based on the MEAN.io stack (MongoDB, Express, AngularJS and Node.js). Running it on your own workstation requires therefore, Node.JS, MongoDB and NPM. You can also run it as a Dokku container on a service like DigitalOcean.

1. First install Dokku. 
2. Next you need to install the following plugins:
  + [dokku-apt](https://github.com/F4-Group/dokku-apt)
  + [dokku-mongodb-plugin](https://github.com/jeffutter/dokku-mongodb-plugin)
  + [dokku-persistent-storage](https://github.com/dyson/dokku-persistent-storage)

3. Push your Yeastriction copy to the dokku server. 

4. Modify in `/home/dokku/<yourapp>` the file `ENV` to include

  ```
  export NODE_ENV="production"
  export GENOMES_DIR="/genomes/"
  ```

5. Edit in the same directory the file `PERSISTENT_STORAGE` to link the `GENOMES_DIR` in the container to a directory on the server, e.g.:

  ```
  /home/<username>/genomes:/genomes
  ```

6. Create a MongoDB database for the newly created app: ```dokku mongodb:create <app>```

7. In a webbrowser go your Yeastriction instance and add a user.

8. Using `dokku mongodb:console <app>` add the 'admin' role to your newly created user.

9. In your `genomes` directory for every strain you want to include you need a few files:
  + STRAIN.tab (contains tab delimited data of all the orfs, including their up and down region)
  <br />The file should contain the following fields (seperated by tabs):
    
    ```
    YAL001C   TFC3       1001    4574    ACTTGTAAAT...
    ```
    
    The first field refers to the systematic name, the second to the symbolic name, followed by the start and stop position of the ORF within the sequence followed by the sequence of the ORF including its up and down sequence.
  + STRAIN.fsa (the complete genome of the strain, if you've run bowtie, you don't actually need them anymore)
  + STRAIN.(rev.)?(1|2).ebwt (files outputed by bowtie using the command `bowtie-build -r STRAIN.fsa STRAIN`)

10. Next import your strain by going to the URL `http://<yoururl>/crispr/import/STRAIN`

# FAQ

## dokku-apt-plugin quits with an error
If the error is something like `Err: http://archive.ubuntu.com quantal/main amd64 Packages 404 Not Found`, follow the instructions at [DigitalOcean](https://www.digitalocean.com/community/questions/ubunutu-dokku-docker-apt-get-update-issue).

## Is Yeastriction only relevant for finding targets in yeast genomes?
Although Yeastriction is built with *Saccharomyces cerevisiae* in mind, it can be easily modified to work with other organisms. To do so, alter [public/crispr/controllers/crispr.js](https://github.com/hillstub/Yeastriction/blob/master/public/crispr/controllers/crispr.js#L57) to match your ORF symbols or systematic names and [server/controllers/loci.js](https://github.com/hillstub/Yeastriction/blob/master/server/controllers/loci.js#L167) to distinguish between symbolic name or systematic name.

## More Information
  * See our paper: <br /> Robert Mans, Harmen M. van Rossum, Melanie Wijsman, Antoon Backx, Niels G.A. Kuijpers, Marcel van den Broek, Pascale Daran-Lapujade, Jack T. Pronk, Antonius J.A. van Maris, Jean-Marc G. Daran (2015) CRISPR/Cas9: a molecular Swiss army knife for simultaneous introduction of multiple genetic modifications in *Saccharomyces cerevisiae*. *FEMS Yeast Research* **15**. [[PubMed](http://www.ncbi.nlm.nih.gov/pubmed/25743786)] [[FEMS Yeast Research](http://femsyr.oxfordjournals.org/content/15/2/fov004)]

## References
  * Braglia P, Percudani R & Dieci G (2005) Sequence context effects on oligo(dT) termination signal recognition by *Saccharomyces cerevisiae* RNA polymerase III. *J Biol Chem* 280: 19551–19562.
  * Hsu PD, Scott D A, Weinstein J A, et al. (2013) DNA targeting specificity of RNA-guided Cas9 nucleases. *Nat Biotechnol* 31: 827–832.
  * Langmead B, Trapnell C, Pop M & Salzberg SL (2009) Ultrafast and memory-efficient alignment of short DNA sequences to the human genome. *Genome Biol* 10: R25.
  * Lorenz R, Bernhart SH, Höner Zu Siederdissen C, Tafer H, Flamm C, Stadler PF & Hofacker IL (2011) ViennaRNA Package 2.0. *Algorithms Mol Biol* 6: 26.
  * Wang Q & Wang L (2008) New methods enabling efficient incorporation of unnatural amino acids in yeast. *J Am Chem Soc* 130: 6066–6067.

## License
[The MIT License](http://opensource.org/licenses/MIT)
