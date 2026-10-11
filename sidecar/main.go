// Command flagger is the one-shot Root Cause flag generator sidecar.
//
// It runs once per challenge boot, asks the Root Cause API for a per-run flag,
// and writes that flag to a shared volume so the challenge entrypoint can copy
// it into place before the challenge process starts. If a flag is already
// present on the volume it reuses it instead of minting a new one, which keeps
// restarts of the same compose stack idempotent.
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const defaultAPIURL = "https://root-cause-api.matejbasic.com"

const defaultFlagPath = "/flag/flag.txt"

// httpTimeout bounds the whole request to the API so a stuck network call
// cannot hang the challenge boot forever.
const httpTimeout = 30 * time.Second

// runResponse is the 200 body returned by POST /challenges/:slug/run.
type runResponse struct {
	RunID string `json:"runId"`
	Flag  string `json:"flag"`
}

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "flagger: "+err.Error())
		os.Exit(1)
	}
}

func run() error {
	apiURL := envOr("ROOTCAUSE_API_URL", defaultAPIURL)
	flagPath := envOr("FLAG_PATH", defaultFlagPath)

	apiKey := os.Getenv("ROOTCAUSE_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("ROOTCAUSE_API_KEY is required but not set")
	}

	slug := os.Getenv("ROOTCAUSE_CHALLENGE")
	if slug == "" {
		return fmt.Errorf("ROOTCAUSE_CHALLENGE is required but not set")
	}

	// Cache reuse: a non-empty flag on the shared volume means a previous run
	// already minted one. Reuse it so restarts do not burn rate-limit budget.
	if info, err := os.Stat(flagPath); err == nil && !info.IsDir() && info.Size() > 0 {
		fmt.Printf("flagger: %s already present (%d bytes), reusing cached flag\n", flagPath, info.Size())
		return nil
	}

	flag, runID, err := fetchFlag(apiURL, slug, apiKey)
	if err != nil {
		return err
	}

	if err := writeFlag(flagPath, flag); err != nil {
		return err
	}

	fmt.Printf("flagger: wrote flag for challenge %q (run %s) to %s\n", slug, runID, flagPath)
	return nil
}

// fetchFlag mints a per-run flag from the API and returns the flag and run id.
func fetchFlag(apiURL, slug, apiKey string) (flag, runID string, err error) {
	endpoint := strings.TrimRight(apiURL, "/") + "/challenges/" + slug + "/run"

	req, err := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader([]byte{}))
	if err != nil {
		return "", "", fmt.Errorf("building request to %s: %w", endpoint, err)
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: httpTimeout}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("requesting flag from %s: %w", endpoint, err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", fmt.Errorf("reading response from %s: %w", endpoint, err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", "", fmt.Errorf("API returned %s for %s: %s", resp.Status, endpoint, strings.TrimSpace(string(body)))
	}

	var parsed runResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return "", "", fmt.Errorf("parsing JSON from %s: %w", endpoint, err)
	}
	if parsed.Flag == "" {
		return "", "", fmt.Errorf("API response from %s had an empty flag", endpoint)
	}

	return parsed.Flag, parsed.RunID, nil
}

// writeFlag creates the parent directory and writes the flag to path.
func writeFlag(path, flag string) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("creating directory %s: %w", dir, err)
	}
	if err := os.WriteFile(path, []byte(flag), 0o644); err != nil {
		return fmt.Errorf("writing flag to %s: %w", path, err)
	}
	return nil
}

// envOr returns the value of the named env var, or fallback when it is unset or empty.
func envOr(name, fallback string) string {
	if v := os.Getenv(name); v != "" {
		return v
	}
	return fallback
}
