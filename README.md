# CRISPR webservice

* downloaded http://downloads.yeastgenome.org/sequence/S288C_reference/genome_releases/S288C_reference_genome_R64-1-1_20110203.tgz --> S288C_reference_sequence_R64-1-1_20110203.fsa renamed to S288C.fa
* run blast command to make a database
* makeblastdb -in S288C.fa -dbtype 'nucl' -out S288C
cat input.fa |  blastn -db S288C -word_size 10 -outfmt "6 qstart qend mismatch gaps qseqid sseq" | awk -F"\t" '$1 <= 10 && $2 == 23 { print $5"\t"$6 }' | sort -k1 -n | awk '(count[$1]++ < 1) { data[$1] = $0; } END { for (x in data) if (count[x] == 1) print data[x]; }' | sort -k1 -n
* important to add ncbi-blast+ to apt-repositories


http://www.ncbi.nlm.nih.gov/books/NBK1763/#CmdLineAppsManual.Custom_data_extraction
## More Information
  * Visit us at [Linnovate.net](http://www.linnovate.net/).
  * Visit our [Ninja's Zone](http://www.meanleanstartupmachine.com/) for extended support.

## License
[The MIT License](http://opensource.org/licenses/MIT)
