package main

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
)

// flaggerImage is fixed for every challenge: the one-shot sidecar that mints a
// per-run flag and writes it to the shared volume at /flag/flag.txt.
const flaggerImage = "matejbasic/rootcause-flagger:latest"

// slugRe constrains a slug to a safe path segment so it can be used in cache
// paths and the compose without traversal or shell surprises.
var slugRe = regexp.MustCompile(`^[a-z0-9][a-z0-9-]*$`)

func validSlug(slug string) bool {
	return slugRe.MatchString(slug)
}

// cacheDir returns ~/.cache/rootcause, honoring XDG_CACHE_HOME when set.
func cacheDir() (string, error) {
	if x := os.Getenv("XDG_CACHE_HOME"); x != "" {
		return filepath.Join(x, "rootcause"), nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".cache", "rootcause"), nil
}

// challengeDir returns ~/.cache/rootcause/<slug>.
func challengeDir(slug string) (string, error) {
	base, err := cacheDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(base, slug), nil
}

// composeTemplate is the canonical per-challenge compose from the self-host
// contract. Only the API URL, the slug, and the challenge image vary; the
// sidecar image and the rest of the shape are identical for every challenge.
// The API key is NOT embedded here; it is supplied via the sibling .env as
// ${ROOTCAUSE_API_KEY}.
const composeTemplate = `services:
  flagger:
    image: %s
    environment:
      ROOTCAUSE_API_URL: %s
      ROOTCAUSE_API_KEY: ${ROOTCAUSE_API_KEY}
      ROOTCAUSE_CHALLENGE: %s
      FLAG_PATH: /flag/flag.txt
    volumes:
      - flag:/flag
  challenge:
    image: %s
    depends_on:
      flagger:
        condition: service_completed_successfully
    environment:
      FLAG_PATH: /flag/flag.txt
    volumes:
      - flag:/flag
    ports:
      - "8080:8080"
volumes:
  flag:
`

// renderCompose fills the template for one challenge.
func renderCompose(apiURL, slug, image string) string {
	return fmt.Sprintf(composeTemplate, flaggerImage, apiURL, slug, image)
}

// writeComposeFiles writes compose.yml and the sibling .env into the
// challenge's cache dir and returns their paths. The .env is written 0600
// since it carries the API key.
func writeComposeFiles(cfg *Config, slug, image string) (composePath, envPath string, err error) {
	dir, err := challengeDir(slug)
	if err != nil {
		return "", "", err
	}
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return "", "", err
	}
	composePath = filepath.Join(dir, "compose.yml")
	envPath = filepath.Join(dir, ".env")

	compose := renderCompose(cfg.APIURL, slug, image)
	if err := os.WriteFile(composePath, []byte(compose), 0o644); err != nil {
		return "", "", err
	}

	env := fmt.Sprintf("ROOTCAUSE_API_KEY=%s\n", cfg.APIKey)
	if err := os.WriteFile(envPath, []byte(env), 0o600); err != nil {
		return "", "", err
	}
	if err := os.Chmod(envPath, 0o600); err != nil {
		return "", "", err
	}
	return composePath, envPath, nil
}

// composePathFor returns the expected compose.yml path for a slug without
// writing anything (used by `stop`).
func composePathFor(slug string) (string, error) {
	dir, err := challengeDir(slug)
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "compose.yml"), nil
}
