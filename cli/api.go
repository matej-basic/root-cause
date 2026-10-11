package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// Challenge mirrors the fields of a challenge the CLI needs. The API returns
// more fields; unknown ones are ignored. "image" is the published image name
// used to generate the compose (see the self-host contract).
type Challenge struct {
	Slug       string `json:"slug"`
	Title      string `json:"title"`
	Difficulty string `json:"difficulty"`
	Image      string `json:"image"`
}

// httpClient is shared so calls get a sane timeout.
var httpClient = &http.Client{Timeout: 30 * time.Second}

// apiGet performs an authenticated GET against the configured API and returns
// the raw body. A Bearer token is attached when a key is stored; GET endpoints
// treat auth as optional, so an empty key is fine for `list`.
func apiGet(cfg *Config, path string) ([]byte, error) {
	url := strings.TrimRight(cfg.APIURL, "/") + path
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	if cfg.APIKey != "" {
		req.Header.Set("Authorization", "Bearer "+cfg.APIKey)
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request to %s failed: %w", url, err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%s returned %s: %s", url, resp.Status, snippet(body))
	}
	return body, nil
}

// snippet trims a response body for inclusion in an error message.
func snippet(b []byte) string {
	s := strings.TrimSpace(string(b))
	if len(s) > 200 {
		s = s[:200] + "..."
	}
	return s
}

// fetchChallenges reads GET /challenges. The documented shape is
// { "challenges": [...] }; a bare array is accepted as a fallback.
func fetchChallenges(cfg *Config) ([]Challenge, error) {
	body, err := apiGet(cfg, "/challenges")
	if err != nil {
		return nil, err
	}
	var wrapped struct {
		Challenges []Challenge `json:"challenges"`
	}
	if err := json.Unmarshal(body, &wrapped); err == nil && wrapped.Challenges != nil {
		return wrapped.Challenges, nil
	}
	var bare []Challenge
	if err := json.Unmarshal(body, &bare); err == nil {
		return bare, nil
	}
	return nil, fmt.Errorf("could not parse /challenges response: %s", snippet(body))
}

// fetchChallenge reads GET /challenges/:slug. The documented shape is
// { "challenge": {...} }; a bare object is accepted as a fallback.
func fetchChallenge(cfg *Config, slug string) (*Challenge, error) {
	body, err := apiGet(cfg, "/challenges/"+slug)
	if err != nil {
		return nil, err
	}
	var wrapped struct {
		Challenge *Challenge `json:"challenge"`
	}
	if err := json.Unmarshal(body, &wrapped); err == nil && wrapped.Challenge != nil {
		return wrapped.Challenge, nil
	}
	var bare Challenge
	if err := json.Unmarshal(body, &bare); err == nil && bare.Slug != "" {
		return &bare, nil
	}
	return nil, fmt.Errorf("could not parse /challenges/%s response: %s", slug, snippet(body))
}
