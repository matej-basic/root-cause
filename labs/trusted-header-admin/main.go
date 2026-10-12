// Root Cause lab: trusted-header-admin.
//
// The /admin operations panel is meant to be reachable from the internal
// network only. The gate that enforces this trusts a client-supplied
// request header instead of looking at where the connection actually came
// from, so any client can forge its way past it. The per-run flag is NOT
// read by this app on request; it is loaded once at startup from
// FLAG_PATH and only ever handed back through the broken /admin gate.
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
)

var flag string

func readFlag(path string) string {
	data, err := os.ReadFile(path)
	if err != nil {
		log.Printf("warning: could not read flag file %s: %v", path, err)
		return ""
	}
	return strings.TrimSpace(string(data))
}

func index(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Root Cause lab: operations console.\n"+
		"The /admin panel is for internal network use only.\n")
}

// admin is the operations panel. It is documented as internal-only, so the
// check below trusts a header set by an upstream load balancer to say the
// request came from localhost, rather than checking the actual connection.
func admin(w http.ResponseWriter, r *http.Request) {
	if r.Header.Get("X-Forwarded-For") != "127.0.0.1" {
		http.Error(w, "403 forbidden: internal network only", http.StatusForbidden)
		return
	}
	fmt.Fprintf(w, "Operations console\n===================\n\nFlag: %s\n", flag)
}

func main() {
	flagPath := os.Getenv("FLAG_PATH")
	if flagPath == "" {
		flagPath = "/flag/flag.txt"
	}
	flag = readFlag(flagPath)

	http.HandleFunc("/", index)
	http.HandleFunc("/admin", admin)

	log.Println("listening on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
