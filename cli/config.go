package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// defaultAPIURL is the hosted Root Cause API used when no override is stored.
const defaultAPIURL = "https://root-cause-api.matejbasic.com"

// Config is persisted at ~/.config/rootcause/config.json.
type Config struct {
	APIURL string `json:"api_url"`
	APIKey string `json:"api_key"`
}

// configDir returns ~/.config/rootcause, honoring XDG_CONFIG_HOME when set.
func configDir() (string, error) {
	if x := os.Getenv("XDG_CONFIG_HOME"); x != "" {
		return filepath.Join(x, "rootcause"), nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".config", "rootcause"), nil
}

// configPath returns the full path to config.json.
func configPath() (string, error) {
	dir, err := configDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "config.json"), nil
}

// loadConfig reads the stored config. A missing file yields defaults rather
// than an error, so `list` can run against the public API before `login`.
func loadConfig() (*Config, error) {
	cfg := &Config{APIURL: defaultAPIURL}
	path, err := configPath()
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return cfg, nil
		}
		return nil, err
	}
	if err := json.Unmarshal(data, cfg); err != nil {
		return nil, fmt.Errorf("config %s is corrupt: %w", path, err)
	}
	if cfg.APIURL == "" {
		cfg.APIURL = defaultAPIURL
	}
	return cfg, nil
}

// saveConfig writes config.json with dirs at 0700 and the file at 0600, since
// it holds the API key secret.
func saveConfig(cfg *Config) error {
	dir, err := configDir()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return err
	}
	path := filepath.Join(dir, "config.json")
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	data = append(data, '\n')
	// Write 0600 even if the file already existed with looser bits.
	if err := os.WriteFile(path, data, 0o600); err != nil {
		return err
	}
	if err := os.Chmod(path, 0o600); err != nil {
		return err
	}
	return nil
}
