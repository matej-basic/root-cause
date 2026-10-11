// Command rootcause is the CLI for the Root Cause CTF platform. It wraps the
// same per-challenge docker-compose the website hands out, so students can run
// a challenge locally against a per-run flag minted by the hosted API.
package main

import (
	"fmt"
	"os"
)

const usageText = `rootcause - run Root Cause CTF challenges locally

Usage:
  rootcause login [--key <key>] [--api-url <url>]   store your API key
  rootcause list                                    list available challenges
  rootcause start <slug>                            generate compose and run a challenge
  rootcause stop <slug>                             stop a running challenge
  rootcause status                                  show running rootcause challenges

Config lives in ~/.config/rootcause/config.json (API URL + key, 0600).
Submitting flags is web-only; there is no submit command.`

func usage() {
	fmt.Fprintln(os.Stderr, usageText)
}

func main() {
	if len(os.Args) < 2 {
		usage()
		os.Exit(2)
	}

	var err error
	switch os.Args[1] {
	case "login":
		err = cmdLogin(os.Args[2:])
	case "list":
		err = cmdList(os.Args[2:])
	case "start":
		err = cmdStart(os.Args[2:])
	case "stop":
		err = cmdStop(os.Args[2:])
	case "status":
		err = cmdStatus(os.Args[2:])
	case "-h", "--help", "help":
		usage()
		return
	default:
		fmt.Fprintf(os.Stderr, "unknown command %q\n\n", os.Args[1])
		usage()
		os.Exit(2)
	}

	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
}
