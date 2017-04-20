use strict;
use diagnostics;

my ($turbofile, $toknofile, $tokenfile) = @ARGV;

my $pii;
my %classesMap = ();
my %tokensMap = ();
my %toknosMap = ();

my ($classes, $tokens, $toknos);
my ($cs, $ts, $ns);
my ($tokno, $hlno);

open TURBOFILE, "<$turbofile" or die "$! $turbofile";

while (<TURBOFILE>) {
    if (/PII_FOUND.+(S(?:X|\d){16})/) {
	$classesMap {$1} = $classes = [];
	$tokensMap {$1} = $tokens = [];
	next;
    }
    if (/^[1-9]/) {
	push @$classes, $cs = [];
	push @$tokens, $ts = [];
	next;
    }
    if (/^\t/) {
	my ($t, $p, $c) = /^\t\d+\t(.+?)\t.+([^\t]+)\t([^\t|\n]+)$/s;
	$c = 'UNK' if $p =~ /^\d+$/;
	push @$cs, $c;
	push @$ts, $t;
    }
}

close TURBOFILE;

open TOKNOFILE, "<$toknofile" or de $!;

my ($currentPiiTokens, $currentPiiClasses, $currentPiiToknos);
my ($currentTokens, $currentClasses, $currentToknos);

while (<TOKNOFILE>) {
    if (/PII="(.+)"/) {
	$toknosMap {$1} = $toknos = [];
	$hlno = 0;
	$currentPiiTokens = $tokensMap {$1};
	next;
    }
    if (/^<HL/) {
	$tokno = 0;
	push @$toknos, $ns = [];
	$currentTokens = $currentPiiTokens -> [$hlno ++];
	next;
    }
    unless (/^<.+>$/) {
	my ($t, $n) = /^(.+?)\t.+?(\d+)$/;
	push @$ns, $n - 1;
	die "argh $." unless $t eq $currentTokens->[$tokno];
	$tokno ++;
	next;
    }
}

close TOKNOFILE;

open TOKENFILE, "<$tokenfile" or die $!;

my @classes;
while (<TOKENFILE>) {
    if (/PII="(.+)"/) {
	$currentPiiClasses = $classesMap {$1};
	$currentPiiToknos = $toknosMap {$1};
	$hlno = 0;
	print;
	next;
    }
    if (/^<HL/) {
	$currentClasses = $currentPiiClasses -> [$hlno];
	$currentToknos = $currentPiiToknos -> [$hlno];
	$hlno ++;
	$tokno = 0;
	@classes = ();
	@classes [@$currentToknos] = @$currentClasses;
	print;
	next;
    }
    unless (/^<.+>$/) {
	my $c = lc ($classes [$tokno] || 'unk');
	chomp;
	print "$_\t$c\n";
	$tokno ++;
	next;
    }
    print;
}

close TOKENFILE;
