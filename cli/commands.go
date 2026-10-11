package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"strings"
	"text/tabwriter"
)

// cmdLogin stores the API key and API URL in the config file.
func cmdLogin(args []string) error {
	fs := flag.NewFlagSet("login", flag.ContinueOnError)
	keyFlag := fs.String("key", "", "API key (if omitted, you are prompted on stdin)")
	urlFlag := fs.String("api-url", "", "API base URL (defaults to the stored value or "+defaultAPIURL+")")
	if err := fs.Parse(args); err != nil {
		return err
	}

	cfg, err := loadConfig()
	if err != nil {
		return err
	}
	if *urlFlag != "" {
		cfg.APIURL = strings.TrimRight(*urlFlag, "/")
	}

	key := *keyFlag
	if key == "" {
		fmt.Fprint(os.Stderr, "API key: ")
		reader := bufio.NewReader(os.Stdin)
		line, err := reader.ReadString('\n')
		if err != nil && line == "" {
			return fmt.Errorf("could not read API key: %w", err)
		}
		key = strings.TrimSpace(line)
	}
	key = strings.TrimSpace(key)
	if key == "" {
		return fmt.Errorf("no API key provided")
	}
	cfg.APIKey = key

	if err := saveConfig(cfg); err != nil {
		return err
	}
	path, _ := configPath()
	fmt.Printf("Saved API key for %s to %s\n", cfg.APIURL, path)
	return nil
}

// cmdList prints the challenge catalog as a simple table.
func cmdList(args []string) error {
	fs := flag.NewFlagSet("list", flag.ContinueOnError)
	if err := fs.Parse(args); err != nil {
		return err
	}
	cfg, err := loadConfig()
	if err != nil {
		return err
	}
	challenges, err := fetchChallenges(cfg)
	if err != nil {
		return err
	}
	if len(challenges) == 0 {
		fmt.Println("No challenges found.")
		return nil
	}
	w := tabwriter.NewWriter(os.Stdout, 0, 2, 2, ' ', 0)
	fmt.Fprintln(w, "SLUG\tTITLE\tDIFFICULTY")
	for _, c := range challenges {
		fmt.Fprintf(w, "%s\t%s\t%s\n", c.Slug, c.Title, c.Difficulty)
	}
	return w.Flush()
}

// cmdStart generates the compose for a challenge and brings it up.
func cmdStart(args []string) error {
	fs := flag.NewFlagSet("start", flag.ContinueOnError)
	if err := fs.Parse(args); err != nil {
		return err
	}
	if fs.NArg() < 1 {
		return fmt.Errorf("usage: rootcause start <slug>")
	}
	slug := fs.Arg(0)
	if !validSlug(slug) {
		return fmt.Errorf("invalid slug %q (expected lowercase letters, digits and hyphens)", slug)
	}

	cfg, err := loadConfig()
	if err != nil {
		return err
	}
	if cfg.APIKey == "" {
		return fmt.Errorf("no API key stored; run `rootcause login` first")
	}

	ch, err := fetchChallenge(cfg, slug)
	if err != nil {
		return err
	}
	if ch.Image == "" {
		return fmt.Errorf("challenge %q has no image field; cannot generate compose", slug)
	}

	composePath, envPath, err := writeComposeFiles(cfg, slug, ch.Image)
	if err != nil {
		return err
	}
	fmt.Printf("Wrote %s\n", composePath)
	fmt.Printf("Starting %s (%s)...\n", slug, ch.Image)

	code, err := composeUp(composePath, envPath, slug)
	if err != nil {
		return err
	}
	if code != 0 {
		return fmt.Errorf("docker compose up exited with code %d", code)
	}
	return nil
}

// cmdStop tears down a running challenge.
func cmdStop(args []string) error {
	fs := flag.NewFlagSet("stop", flag.ContinueOnError)
	if err := fs.Parse(args); err != nil {
		return err
	}
	if fs.NArg() < 1 {
		return fmt.Errorf("usage: rootcause stop <slug>")
	}
	slug := fs.Arg(0)
	if !validSlug(slug) {
		return fmt.Errorf("invalid slug %q", slug)
	}
	composePath, err := composePathFor(slug)
	if err != nil {
		return err
	}
	if _, err := os.Stat(composePath); err != nil {
		return fmt.Errorf("no compose file for %q at %s (was it started?)", slug, composePath)
	}
	code, err := composeDown(composePath, slug)
	if err != nil {
		return err
	}
	if code != 0 {
		return fmt.Errorf("docker compose down exited with code %d", code)
	}
	return nil
}

// cmdStatus lists running rootcause challenges, best effort.
func cmdStatus(args []string) error {
	fs := flag.NewFlagSet("status", flag.ContinueOnError)
	if err := fs.Parse(args); err != nil {
		return err
	}
	return dockerStatus()
}
