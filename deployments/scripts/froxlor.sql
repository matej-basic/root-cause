-- MySQL dump 10.19  Distrib 10.3.37-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: froxlor
-- ------------------------------------------------------
-- Server version	10.3.37-MariaDB-0ubuntu0.20.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cronjobs_run`
--

DROP TABLE IF EXISTS `cronjobs_run`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cronjobs_run` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `module` varchar(250) NOT NULL,
  `cronfile` varchar(250) NOT NULL,
  `lastrun` int(15) NOT NULL DEFAULT 0,
  `interval` varchar(100) NOT NULL DEFAULT '5 MINUTE',
  `isactive` tinyint(1) DEFAULT 1,
  `desc_lng_key` varchar(100) NOT NULL DEFAULT 'cron_unknown_desc',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cronjobs_run`
--

LOCK TABLES `cronjobs_run` WRITE;
/*!40000 ALTER TABLE `cronjobs_run` DISABLE KEYS */;
INSERT INTO `cronjobs_run` VALUES (1,'froxlor/core','tasks',0,'5 MINUTE',1,'cron_tasks'),(2,'froxlor/core','traffic',0,'1 DAY',1,'cron_traffic'),(3,'froxlor/ticket','used_tickets_reset',0,'1 DAY',1,'cron_ticketsreset'),(4,'froxlor/ticket','ticketarchive',0,'1 MONTH',1,'cron_ticketarchive'),(5,'froxlor/reports','usage_report',0,'1 DAY',1,'cron_usage_report'),(6,'froxlor/core','mailboxsize',0,'6 HOUR',1,'cron_mailboxsize'),(7,'froxlor/letsencrypt','letsencrypt',0,'5 MINUTE',0,'cron_letsencrypt'),(8,'froxlor/backup','backup',0,'1 DAY',1,'cron_backup');
/*!40000 ALTER TABLE `cronjobs_run` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `domain_dns_entries`
--

DROP TABLE IF EXISTS `domain_dns_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `domain_dns_entries` (
  `id` int(20) NOT NULL AUTO_INCREMENT,
  `domain_id` int(15) NOT NULL,
  `record` varchar(255) NOT NULL,
  `type` varchar(10) NOT NULL DEFAULT 'A',
  `content` text NOT NULL,
  `ttl` int(11) NOT NULL DEFAULT 18000,
  `prio` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `domain_dns_entries`
--

LOCK TABLES `domain_dns_entries` WRITE;
/*!40000 ALTER TABLE `domain_dns_entries` DISABLE KEYS */;
/*!40000 ALTER TABLE `domain_dns_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `domain_redirect_codes`
--

DROP TABLE IF EXISTS `domain_redirect_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `domain_redirect_codes` (
  `rid` int(5) NOT NULL,
  `did` int(11) unsigned NOT NULL,
  UNIQUE KEY `rc` (`rid`,`did`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `domain_redirect_codes`
--

LOCK TABLES `domain_redirect_codes` WRITE;
/*!40000 ALTER TABLE `domain_redirect_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `domain_redirect_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `domain_ssl_settings`
--

DROP TABLE IF EXISTS `domain_ssl_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `domain_ssl_settings` (
  `id` int(5) NOT NULL AUTO_INCREMENT,
  `domainid` int(11) NOT NULL,
  `ssl_cert_file` mediumtext NOT NULL,
  `ssl_key_file` mediumtext NOT NULL,
  `ssl_ca_file` mediumtext DEFAULT NULL,
  `ssl_cert_chainfile` mediumtext DEFAULT NULL,
  `ssl_csr_file` mediumtext DEFAULT NULL,
  `expirationdate` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `domain_ssl_settings`
--

LOCK TABLES `domain_ssl_settings` WRITE;
/*!40000 ALTER TABLE `domain_ssl_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `domain_ssl_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ftp_groups`
--

DROP TABLE IF EXISTS `ftp_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ftp_groups` (
  `id` int(20) NOT NULL AUTO_INCREMENT,
  `groupname` varchar(60) NOT NULL DEFAULT '',
  `gid` int(5) NOT NULL DEFAULT 0,
  `members` longtext NOT NULL,
  `customerid` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `groupname` (`groupname`),
  KEY `customerid` (`customerid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ftp_groups`
--

LOCK TABLES `ftp_groups` WRITE;
/*!40000 ALTER TABLE `ftp_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `ftp_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ftp_quotalimits`
--

DROP TABLE IF EXISTS `ftp_quotalimits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ftp_quotalimits` (
  `name` varchar(30) DEFAULT NULL,
  `quota_type` enum('user','group','class','all') NOT NULL DEFAULT 'user',
  `per_session` enum('false','true') NOT NULL DEFAULT 'false',
  `limit_type` enum('soft','hard') NOT NULL DEFAULT 'hard',
  `bytes_in_avail` float NOT NULL,
  `bytes_out_avail` float NOT NULL,
  `bytes_xfer_avail` float NOT NULL,
  `files_in_avail` int(10) unsigned NOT NULL,
  `files_out_avail` int(10) unsigned NOT NULL,
  `files_xfer_avail` int(10) unsigned NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ftp_quotalimits`
--

LOCK TABLES `ftp_quotalimits` WRITE;
/*!40000 ALTER TABLE `ftp_quotalimits` DISABLE KEYS */;
INSERT INTO `ftp_quotalimits` VALUES ('froxlor','user','false','hard',0,0,0,0,0,0);
/*!40000 ALTER TABLE `ftp_quotalimits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ftp_quotatallies`
--

DROP TABLE IF EXISTS `ftp_quotatallies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ftp_quotatallies` (
  `name` varchar(30) NOT NULL,
  `quota_type` enum('user','group','class','all') NOT NULL,
  `bytes_in_used` float NOT NULL,
  `bytes_out_used` float NOT NULL,
  `bytes_xfer_used` float NOT NULL,
  `files_in_used` int(10) unsigned NOT NULL,
  `files_out_used` int(10) unsigned NOT NULL,
  `files_xfer_used` int(10) unsigned NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ftp_quotatallies`
--

LOCK TABLES `ftp_quotatallies` WRITE;
/*!40000 ALTER TABLE `ftp_quotatallies` DISABLE KEYS */;
/*!40000 ALTER TABLE `ftp_quotatallies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ftp_users`
--

DROP TABLE IF EXISTS `ftp_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ftp_users` (
  `id` int(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL DEFAULT '',
  `uid` int(5) NOT NULL DEFAULT 0,
  `gid` int(5) NOT NULL DEFAULT 0,
  `password` varchar(128) NOT NULL DEFAULT '',
  `homedir` varchar(255) NOT NULL DEFAULT '',
  `shell` varchar(255) NOT NULL DEFAULT '/bin/false',
  `login_enabled` enum('N','Y') NOT NULL DEFAULT 'N',
  `login_count` int(15) NOT NULL DEFAULT 0,
  `last_login` datetime DEFAULT NULL,
  `up_count` int(15) NOT NULL DEFAULT 0,
  `up_bytes` bigint(30) NOT NULL DEFAULT 0,
  `down_count` int(15) NOT NULL DEFAULT 0,
  `down_bytes` bigint(30) NOT NULL DEFAULT 0,
  `customerid` int(11) NOT NULL DEFAULT 0,
  `description` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `customerid` (`customerid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ftp_users`
--

LOCK TABLES `ftp_users` WRITE;
/*!40000 ALTER TABLE `ftp_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `ftp_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mail_users`
--

DROP TABLE IF EXISTS `mail_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mail_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL DEFAULT '',
  `username` varchar(255) NOT NULL DEFAULT '',
  `password` varchar(128) NOT NULL DEFAULT '',
  `password_enc` varchar(128) NOT NULL DEFAULT '',
  `uid` int(11) NOT NULL DEFAULT 0,
  `gid` int(11) NOT NULL DEFAULT 0,
  `homedir` varchar(255) NOT NULL DEFAULT '',
  `maildir` varchar(255) NOT NULL DEFAULT '',
  `postfix` enum('Y','N') NOT NULL DEFAULT 'Y',
  `domainid` int(11) NOT NULL DEFAULT 0,
  `customerid` int(11) NOT NULL DEFAULT 0,
  `quota` bigint(13) NOT NULL DEFAULT 0,
  `pop3` tinyint(1) NOT NULL DEFAULT 1,
  `imap` tinyint(1) NOT NULL DEFAULT 1,
  `mboxsize` bigint(30) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mail_users`
--

LOCK TABLES `mail_users` WRITE;
/*!40000 ALTER TABLE `mail_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `mail_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mail_virtual`
--

DROP TABLE IF EXISTS `mail_virtual`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mail_virtual` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL DEFAULT '',
  `email_full` varchar(255) NOT NULL DEFAULT '',
  `destination` text DEFAULT NULL,
  `domainid` int(11) NOT NULL DEFAULT 0,
  `customerid` int(11) NOT NULL DEFAULT 0,
  `popaccountid` int(11) NOT NULL DEFAULT 0,
  `iscatchall` tinyint(1) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `email` (`email`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mail_virtual`
--

LOCK TABLES `mail_virtual` WRITE;
/*!40000 ALTER TABLE `mail_virtual` DISABLE KEYS */;
/*!40000 ALTER TABLE `mail_virtual` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_activation`
--

DROP TABLE IF EXISTS `panel_activation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_activation` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `userid` int(11) unsigned NOT NULL DEFAULT 0,
  `admin` tinyint(1) unsigned NOT NULL DEFAULT 0,
  `creation` int(11) unsigned NOT NULL DEFAULT 0,
  `activationcode` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_activation`
--

LOCK TABLES `panel_activation` WRITE;
/*!40000 ALTER TABLE `panel_activation` DISABLE KEYS */;
/*!40000 ALTER TABLE `panel_activation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_admins`
--

DROP TABLE IF EXISTS `panel_admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_admins` (
  `adminid` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `loginname` varchar(50) NOT NULL DEFAULT '',
  `password` varchar(255) NOT NULL DEFAULT '',
  `name` varchar(255) NOT NULL DEFAULT '',
  `email` varchar(255) NOT NULL DEFAULT '',
  `def_language` varchar(255) NOT NULL DEFAULT '',
  `ip` tinyint(4) NOT NULL DEFAULT -1,
  `customers` int(15) NOT NULL DEFAULT 0,
  `customers_used` int(15) NOT NULL DEFAULT 0,
  `customers_see_all` tinyint(1) NOT NULL DEFAULT 0,
  `domains` int(15) NOT NULL DEFAULT 0,
  `domains_used` int(15) NOT NULL DEFAULT 0,
  `domains_see_all` tinyint(1) NOT NULL DEFAULT 0,
  `caneditphpsettings` tinyint(1) NOT NULL DEFAULT 0,
  `change_serversettings` tinyint(1) NOT NULL DEFAULT 0,
  `diskspace` int(15) NOT NULL DEFAULT 0,
  `diskspace_used` int(15) NOT NULL DEFAULT 0,
  `mysqls` int(15) NOT NULL DEFAULT 0,
  `mysqls_used` int(15) NOT NULL DEFAULT 0,
  `emails` int(15) NOT NULL DEFAULT 0,
  `emails_used` int(15) NOT NULL DEFAULT 0,
  `email_accounts` int(15) NOT NULL DEFAULT 0,
  `email_accounts_used` int(15) NOT NULL DEFAULT 0,
  `email_forwarders` int(15) NOT NULL DEFAULT 0,
  `email_forwarders_used` int(15) NOT NULL DEFAULT 0,
  `email_quota` bigint(13) NOT NULL DEFAULT 0,
  `email_quota_used` bigint(13) NOT NULL DEFAULT 0,
  `ftps` int(15) NOT NULL DEFAULT 0,
  `ftps_used` int(15) NOT NULL DEFAULT 0,
  `tickets` int(15) NOT NULL DEFAULT -1,
  `tickets_used` int(15) NOT NULL DEFAULT 0,
  `tickets_see_all` tinyint(1) NOT NULL DEFAULT 0,
  `subdomains` int(15) NOT NULL DEFAULT 0,
  `subdomains_used` int(15) NOT NULL DEFAULT 0,
  `traffic` bigint(30) NOT NULL DEFAULT 0,
  `traffic_used` bigint(30) NOT NULL DEFAULT 0,
  `deactivated` tinyint(1) NOT NULL DEFAULT 0,
  `lastlogin_succ` int(11) unsigned NOT NULL DEFAULT 0,
  `lastlogin_fail` int(11) unsigned NOT NULL DEFAULT 0,
  `loginfail_count` int(11) unsigned NOT NULL DEFAULT 0,
  `reportsent` tinyint(4) unsigned NOT NULL DEFAULT 0,
  `theme` varchar(255) NOT NULL DEFAULT 'Sparkle',
  `custom_notes` text DEFAULT NULL,
  `custom_notes_show` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`adminid`),
  UNIQUE KEY `loginname` (`loginname`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_admins`
--

LOCK TABLES `panel_admins` WRITE;
/*!40000 ALTER TABLE `panel_admins` DISABLE KEYS */;
INSERT INTO `panel_admins` VALUES (1,'admin','$5$82ca8f71ba10c36b$L/yrLrlC87kbkjnaAlTubtpr3pC0FH8T3g07vB3d26D','Froxlor-Administrator','admin@localhost','English',-1,-1,0,1,-1,0,1,1,1,-1024,0,-1,0,-1,0,-1,0,-1,0,-1,0,-1,0,-1,0,1,-1,0,-1048576,0,0,1674141336,0,0,0,'Sparkle',NULL,0);
/*!40000 ALTER TABLE `panel_admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_customers`
--

DROP TABLE IF EXISTS `panel_customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_customers` (
  `customerid` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `loginname` varchar(50) NOT NULL DEFAULT '',
  `password` varchar(255) NOT NULL DEFAULT '',
  `adminid` int(11) unsigned NOT NULL DEFAULT 0,
  `name` varchar(255) NOT NULL DEFAULT '',
  `firstname` varchar(255) NOT NULL DEFAULT '',
  `gender` int(1) NOT NULL DEFAULT 0,
  `company` varchar(255) NOT NULL DEFAULT '',
  `street` varchar(255) NOT NULL DEFAULT '',
  `zipcode` varchar(255) NOT NULL DEFAULT '',
  `city` varchar(255) NOT NULL DEFAULT '',
  `phone` varchar(255) NOT NULL DEFAULT '',
  `fax` varchar(255) NOT NULL DEFAULT '',
  `email` varchar(255) NOT NULL DEFAULT '',
  `customernumber` varchar(255) NOT NULL DEFAULT '',
  `def_language` varchar(255) NOT NULL DEFAULT '',
  `diskspace` bigint(30) NOT NULL DEFAULT 0,
  `diskspace_used` bigint(30) NOT NULL DEFAULT 0,
  `mysqls` int(15) NOT NULL DEFAULT 0,
  `mysqls_used` int(15) NOT NULL DEFAULT 0,
  `emails` int(15) NOT NULL DEFAULT 0,
  `emails_used` int(15) NOT NULL DEFAULT 0,
  `email_accounts` int(15) NOT NULL DEFAULT 0,
  `email_accounts_used` int(15) NOT NULL DEFAULT 0,
  `email_forwarders` int(15) NOT NULL DEFAULT 0,
  `email_forwarders_used` int(15) NOT NULL DEFAULT 0,
  `email_quota` bigint(13) NOT NULL DEFAULT 0,
  `email_quota_used` bigint(13) NOT NULL DEFAULT 0,
  `ftps` int(15) NOT NULL DEFAULT 0,
  `ftps_used` int(15) NOT NULL DEFAULT 0,
  `tickets` int(15) NOT NULL DEFAULT 0,
  `tickets_used` int(15) NOT NULL DEFAULT 0,
  `subdomains` int(15) NOT NULL DEFAULT 0,
  `subdomains_used` int(15) NOT NULL DEFAULT 0,
  `traffic` bigint(30) NOT NULL DEFAULT 0,
  `traffic_used` bigint(30) NOT NULL DEFAULT 0,
  `documentroot` varchar(255) NOT NULL DEFAULT '',
  `standardsubdomain` int(11) NOT NULL DEFAULT 0,
  `guid` int(5) NOT NULL DEFAULT 0,
  `ftp_lastaccountnumber` int(11) NOT NULL DEFAULT 0,
  `mysql_lastaccountnumber` int(11) NOT NULL DEFAULT 0,
  `deactivated` tinyint(1) NOT NULL DEFAULT 0,
  `phpenabled` tinyint(1) NOT NULL DEFAULT 1,
  `lastlogin_succ` int(11) unsigned NOT NULL DEFAULT 0,
  `lastlogin_fail` int(11) unsigned NOT NULL DEFAULT 0,
  `loginfail_count` int(11) unsigned NOT NULL DEFAULT 0,
  `reportsent` tinyint(4) unsigned NOT NULL DEFAULT 0,
  `pop3` tinyint(1) NOT NULL DEFAULT 1,
  `imap` tinyint(1) NOT NULL DEFAULT 1,
  `perlenabled` tinyint(1) NOT NULL DEFAULT 0,
  `dnsenabled` tinyint(1) NOT NULL DEFAULT 0,
  `theme` varchar(255) NOT NULL DEFAULT 'Sparkle',
  `custom_notes` text DEFAULT NULL,
  `custom_notes_show` tinyint(1) NOT NULL DEFAULT 0,
  `lepublickey` mediumtext DEFAULT NULL,
  `leprivatekey` mediumtext DEFAULT NULL,
  `leregistered` tinyint(1) NOT NULL DEFAULT 0,
  `allowed_phpconfigs` varchar(500) NOT NULL DEFAULT '',
  PRIMARY KEY (`customerid`),
  UNIQUE KEY `loginname` (`loginname`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_customers`
--

LOCK TABLES `panel_customers` WRITE;
/*!40000 ALTER TABLE `panel_customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `panel_customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_databases`
--

DROP TABLE IF EXISTS `panel_databases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_databases` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `customerid` int(11) NOT NULL DEFAULT 0,
  `databasename` varchar(255) NOT NULL DEFAULT '',
  `description` varchar(255) NOT NULL DEFAULT '',
  `dbserver` int(11) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `customerid` (`customerid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_databases`
--

LOCK TABLES `panel_databases` WRITE;
/*!40000 ALTER TABLE `panel_databases` DISABLE KEYS */;
/*!40000 ALTER TABLE `panel_databases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_diskspace`
--

DROP TABLE IF EXISTS `panel_diskspace`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_diskspace` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `customerid` int(11) unsigned NOT NULL DEFAULT 0,
  `year` int(4) unsigned zerofill NOT NULL DEFAULT 0000,
  `month` int(2) unsigned zerofill NOT NULL DEFAULT 00,
  `day` int(2) unsigned zerofill NOT NULL DEFAULT 00,
  `stamp` int(11) unsigned NOT NULL DEFAULT 0,
  `webspace` bigint(30) unsigned NOT NULL DEFAULT 0,
  `mail` bigint(30) unsigned NOT NULL DEFAULT 0,
  `mysql` bigint(30) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `customerid` (`customerid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_diskspace`
--

LOCK TABLES `panel_diskspace` WRITE;
/*!40000 ALTER TABLE `panel_diskspace` DISABLE KEYS */;
/*!40000 ALTER TABLE `panel_diskspace` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_diskspace_admins`
--

DROP TABLE IF EXISTS `panel_diskspace_admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_diskspace_admins` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `adminid` int(11) unsigned NOT NULL DEFAULT 0,
  `year` int(4) unsigned zerofill NOT NULL DEFAULT 0000,
  `month` int(2) unsigned zerofill NOT NULL DEFAULT 00,
  `day` int(2) unsigned zerofill NOT NULL DEFAULT 00,
  `stamp` int(11) unsigned NOT NULL DEFAULT 0,
  `webspace` bigint(30) unsigned NOT NULL DEFAULT 0,
  `mail` bigint(30) unsigned NOT NULL DEFAULT 0,
  `mysql` bigint(30) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `adminid` (`adminid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_diskspace_admins`
--

LOCK TABLES `panel_diskspace_admins` WRITE;
/*!40000 ALTER TABLE `panel_diskspace_admins` DISABLE KEYS */;
/*!40000 ALTER TABLE `panel_diskspace_admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_domains`
--

DROP TABLE IF EXISTS `panel_domains`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_domains` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `domain` varchar(255) NOT NULL DEFAULT '',
  `adminid` int(11) unsigned NOT NULL DEFAULT 0,
  `customerid` int(11) unsigned NOT NULL DEFAULT 0,
  `aliasdomain` int(11) unsigned DEFAULT NULL,
  `documentroot` varchar(255) NOT NULL DEFAULT '',
  `isbinddomain` tinyint(1) NOT NULL DEFAULT 0,
  `isemaildomain` tinyint(1) NOT NULL DEFAULT 0,
  `email_only` tinyint(1) NOT NULL DEFAULT 0,
  `iswildcarddomain` tinyint(1) NOT NULL DEFAULT 1,
  `subcanemaildomain` tinyint(1) NOT NULL DEFAULT 0,
  `caneditdomain` tinyint(1) NOT NULL DEFAULT 1,
  `zonefile` varchar(255) NOT NULL DEFAULT '',
  `dkim` tinyint(1) NOT NULL DEFAULT 0,
  `dkim_id` int(11) unsigned NOT NULL DEFAULT 0,
  `dkim_privkey` text DEFAULT NULL,
  `dkim_pubkey` text DEFAULT NULL,
  `wwwserveralias` tinyint(1) NOT NULL DEFAULT 1,
  `parentdomainid` int(11) NOT NULL DEFAULT 0,
  `phpenabled` tinyint(1) NOT NULL DEFAULT 0,
  `openbasedir` tinyint(1) NOT NULL DEFAULT 0,
  `openbasedir_path` tinyint(1) NOT NULL DEFAULT 0,
  `speciallogfile` tinyint(1) NOT NULL DEFAULT 0,
  `ssl_redirect` tinyint(4) NOT NULL DEFAULT 0,
  `specialsettings` text DEFAULT NULL,
  `deactivated` tinyint(1) NOT NULL DEFAULT 0,
  `bindserial` varchar(10) NOT NULL DEFAULT '2000010100',
  `add_date` int(11) NOT NULL DEFAULT 0,
  `registration_date` date DEFAULT NULL,
  `termination_date` date DEFAULT NULL,
  `phpsettingid` int(11) unsigned NOT NULL DEFAULT 1,
  `mod_fcgid_starter` int(4) DEFAULT -1,
  `mod_fcgid_maxrequests` int(4) DEFAULT -1,
  `ismainbutsubto` int(11) unsigned NOT NULL DEFAULT 0,
  `letsencrypt` tinyint(1) NOT NULL DEFAULT 0,
  `hsts` varchar(10) NOT NULL DEFAULT '0',
  `hsts_sub` tinyint(1) NOT NULL DEFAULT 0,
  `hsts_preload` tinyint(1) NOT NULL DEFAULT 0,
  `ocsp_stapling` tinyint(1) DEFAULT 0,
  `http2` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `customerid` (`customerid`),
  KEY `parentdomain` (`parentdomainid`),
  KEY `domain` (`domain`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_domains`
--

LOCK TABLES `panel_domains` WRITE;
/*!40000 ALTER TABLE `panel_domains` DISABLE KEYS */;
/*!40000 ALTER TABLE `panel_domains` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_domaintoip`
--

DROP TABLE IF EXISTS `panel_domaintoip`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_domaintoip` (
  `id_domain` int(11) unsigned NOT NULL,
  `id_ipandports` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id_domain`,`id_ipandports`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_domaintoip`
--

LOCK TABLES `panel_domaintoip` WRITE;
/*!40000 ALTER TABLE `panel_domaintoip` DISABLE KEYS */;
/*!40000 ALTER TABLE `panel_domaintoip` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_fpmdaemons`
--

DROP TABLE IF EXISTS `panel_fpmdaemons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_fpmdaemons` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `description` varchar(50) NOT NULL,
  `reload_cmd` varchar(255) NOT NULL,
  `config_dir` varchar(255) NOT NULL,
  `pm` varchar(15) NOT NULL DEFAULT 'static',
  `max_children` int(4) NOT NULL DEFAULT 1,
  `start_servers` int(4) NOT NULL DEFAULT 20,
  `min_spare_servers` int(4) NOT NULL DEFAULT 5,
  `max_spare_servers` int(4) NOT NULL DEFAULT 35,
  `max_requests` int(4) NOT NULL DEFAULT 0,
  `idle_timeout` int(4) NOT NULL DEFAULT 30,
  `limit_extensions` varchar(255) NOT NULL DEFAULT '.php',
  PRIMARY KEY (`id`),
  UNIQUE KEY `reload` (`reload_cmd`),
  UNIQUE KEY `config` (`config_dir`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_fpmdaemons`
--

LOCK TABLES `panel_fpmdaemons` WRITE;
/*!40000 ALTER TABLE `panel_fpmdaemons` DISABLE KEYS */;
INSERT INTO `panel_fpmdaemons` VALUES (1,'System default','service php7.0-fpm restart','/etc/php/7.0/fpm/pool.d/','static',1,20,5,35,0,30,'.php');
/*!40000 ALTER TABLE `panel_fpmdaemons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_htaccess`
--

DROP TABLE IF EXISTS `panel_htaccess`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_htaccess` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `customerid` int(11) unsigned NOT NULL DEFAULT 0,
  `path` varchar(255) NOT NULL DEFAULT '',
  `options_indexes` tinyint(1) NOT NULL DEFAULT 0,
  `error404path` varchar(255) NOT NULL DEFAULT '',
  `error403path` varchar(255) NOT NULL DEFAULT '',
  `error500path` varchar(255) NOT NULL DEFAULT '',
  `error401path` varchar(255) NOT NULL DEFAULT '',
  `options_cgi` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_htaccess`
--

LOCK TABLES `panel_htaccess` WRITE;
/*!40000 ALTER TABLE `panel_htaccess` DISABLE KEYS */;
/*!40000 ALTER TABLE `panel_htaccess` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_htpasswds`
--

DROP TABLE IF EXISTS `panel_htpasswds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_htpasswds` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `customerid` int(11) unsigned NOT NULL DEFAULT 0,
  `path` varchar(255) NOT NULL DEFAULT '',
  `username` varchar(255) NOT NULL DEFAULT '',
  `password` varchar(255) NOT NULL DEFAULT '',
  `authname` varchar(255) NOT NULL DEFAULT 'Restricted Area',
  PRIMARY KEY (`id`),
  KEY `customerid` (`customerid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_htpasswds`
--

LOCK TABLES `panel_htpasswds` WRITE;
/*!40000 ALTER TABLE `panel_htpasswds` DISABLE KEYS */;
/*!40000 ALTER TABLE `panel_htpasswds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_ipsandports`
--

DROP TABLE IF EXISTS `panel_ipsandports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_ipsandports` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `ip` varchar(39) NOT NULL DEFAULT '',
  `port` int(5) NOT NULL DEFAULT 80,
  `listen_statement` tinyint(1) NOT NULL DEFAULT 0,
  `namevirtualhost_statement` tinyint(1) NOT NULL DEFAULT 0,
  `vhostcontainer` tinyint(1) NOT NULL DEFAULT 0,
  `vhostcontainer_servername_statement` tinyint(1) NOT NULL DEFAULT 0,
  `specialsettings` text DEFAULT NULL,
  `ssl` tinyint(4) NOT NULL DEFAULT 0,
  `ssl_cert_file` varchar(255) NOT NULL,
  `ssl_key_file` varchar(255) NOT NULL,
  `ssl_ca_file` varchar(255) NOT NULL,
  `default_vhostconf_domain` text DEFAULT NULL,
  `ssl_cert_chainfile` varchar(255) NOT NULL,
  `docroot` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ip_port` (`ip`,`port`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_ipsandports`
--

LOCK TABLES `panel_ipsandports` WRITE;
/*!40000 ALTER TABLE `panel_ipsandports` DISABLE KEYS */;
/*!40000 ALTER TABLE `panel_ipsandports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_languages`
--

DROP TABLE IF EXISTS `panel_languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_languages` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `language` varchar(30) NOT NULL DEFAULT '',
  `iso` char(3) NOT NULL DEFAULT 'foo',
  `file` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_languages`
--

LOCK TABLES `panel_languages` WRITE;
/*!40000 ALTER TABLE `panel_languages` DISABLE KEYS */;
INSERT INTO `panel_languages` VALUES (1,'Deutsch','de','lng/german.lng.php'),(2,'English','en','lng/english.lng.php'),(3,'Fran&ccedil;ais','fr','lng/french.lng.php'),(4,'Portugu&ecirc;s','pt','lng/portugues.lng.php'),(5,'Italiano','it','lng/italian.lng.php'),(6,'Nederlands','nl','lng/dutch.lng.php'),(7,'Svenska','sv','lng/swedish.lng.php');
/*!40000 ALTER TABLE `panel_languages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_phpconfigs`
--

DROP TABLE IF EXISTS `panel_phpconfigs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_phpconfigs` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `description` varchar(50) NOT NULL,
  `binary` varchar(255) NOT NULL,
  `file_extensions` varchar(255) NOT NULL,
  `mod_fcgid_starter` int(4) NOT NULL DEFAULT -1,
  `mod_fcgid_maxrequests` int(4) NOT NULL DEFAULT -1,
  `mod_fcgid_umask` varchar(15) NOT NULL DEFAULT '022',
  `fpm_slowlog` tinyint(1) NOT NULL DEFAULT 0,
  `fpm_reqterm` varchar(15) NOT NULL DEFAULT '60s',
  `fpm_reqslow` varchar(15) NOT NULL DEFAULT '5s',
  `phpsettings` text NOT NULL,
  `fpmsettingid` int(11) NOT NULL DEFAULT 1,
  `pass_authorizationheader` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `fpmsettingid` (`fpmsettingid`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_phpconfigs`
--

LOCK TABLES `panel_phpconfigs` WRITE;
/*!40000 ALTER TABLE `panel_phpconfigs` DISABLE KEYS */;
INSERT INTO `panel_phpconfigs` VALUES (1,'Default Config','/usr/bin/php-cgi','php',-1,-1,'022',0,'60s','5s','allow_call_time_pass_reference = Off\r\nallow_url_fopen = Off\r\nasp_tags = Off\r\ndisable_classes =\r\ndisable_functions = curl_exec,curl_multi_exec,exec,parse_ini_file,passthru,popen,proc_close,proc_get_status,proc_nice,proc_open,proc_terminate,shell_exec,show_source,system\r\ndisplay_errors = Off\r\ndisplay_startup_errors = Off\r\nenable_dl = Off\r\nerror_reporting = E_ALL & ~E_NOTICE\r\nexpose_php = Off\r\nfile_uploads = On\r\ncgi.force_redirect = 1\r\ngpc_order = \"GPC\"\r\nhtml_errors = Off\r\nignore_repeated_errors = Off\r\nignore_repeated_source = Off\r\ninclude_path = \".:{PEAR_DIR}\"\r\nlog_errors = On\r\nlog_errors_max_len = 1024\r\nmagic_quotes_gpc = Off\r\nmagic_quotes_runtime = Off\r\nmagic_quotes_sybase = Off\r\nmax_execution_time = 30\r\nmax_input_time = 60\r\nmemory_limit = 128M\r\n{OPEN_BASEDIR_C}open_basedir = \"{OPEN_BASEDIR}\"\r\noutput_buffering = 4096\r\npost_max_size = 16M\r\nprecision = 14\r\nregister_argc_argv = Off\r\nregister_globals = Off\r\nreport_memleaks = On\r\nsendmail_path = \"/usr/sbin/sendmail -t -i -f {CUSTOMER_EMAIL}\"\r\nsession.auto_start = 0\r\nsession.bug_compat_42 = 0\r\nsession.bug_compat_warn = 1\r\nsession.cache_expire = 180\r\nsession.cache_limiter = nocache\r\nsession.cookie_domain =\r\nsession.cookie_lifetime = 0\r\nsession.cookie_path = /\r\nsession.entropy_file = /dev/urandom\r\nsession.entropy_length = 16\r\nsession.gc_divisor = 1000\r\nsession.gc_maxlifetime = 1440\r\nsession.gc_probability = 1\r\nsession.name = PHPSESSID\r\nsession.referer_check =\r\nsession.save_handler = files\r\nsession.save_path = \"{TMP_DIR}\"\r\nsession.serialize_handler = php\r\nsession.use_cookies = 1\r\nsession.use_trans_sid = 0\r\nshort_open_tag = On\r\nsuhosin.mail.protect = 1\r\nsuhosin.simulation = Off\r\ntrack_errors = Off\r\nupload_max_filesize = 32M\r\nupload_tmp_dir = \"{TMP_DIR}\"\r\nvariables_order = \"GPCS\"\r\n;mail.add_x_header = On\r\n;mail.log = \"/var/log/phpmail.log\"\r\nopcache.restrict_api = \"{DOCUMENT_ROOT}\"\r\n',1,0),(2,'Froxlor Vhost Config','/usr/bin/php-cgi','php',-1,-1,'022',0,'60s','5s','allow_call_time_pass_reference = Off\r\nallow_url_fopen = On\r\nasp_tags = Off\r\ndisable_classes =\r\ndisable_functions = curl_multi_exec,exec,parse_ini_file,passthru,popen,proc_close,proc_get_status,proc_nice,proc_open,proc_terminate,shell_exec,show_source,system\r\ndisplay_errors = Off\r\ndisplay_startup_errors = Off\r\nenable_dl = Off\r\nerror_reporting = E_ALL & ~E_NOTICE\r\nexpose_php = Off\r\nfile_uploads = On\r\ncgi.force_redirect = 1\r\ngpc_order = \"GPC\"\r\nhtml_errors = Off\r\nignore_repeated_errors = Off\r\nignore_repeated_source = Off\r\ninclude_path = \".:{PEAR_DIR}\"\r\nlog_errors = On\r\nlog_errors_max_len = 1024\r\nmagic_quotes_gpc = Off\r\nmagic_quotes_runtime = Off\r\nmagic_quotes_sybase = Off\r\nmax_execution_time = 60\r\nmax_input_time = 60\r\nmemory_limit = 128M\r\noutput_buffering = 4096\r\npost_max_size = 16M\r\nprecision = 14\r\nregister_argc_argv = Off\r\nregister_globals = Off\r\nreport_memleaks = On\r\nsendmail_path = \"/usr/sbin/sendmail -t -i -f {CUSTOMER_EMAIL}\"\r\nsession.auto_start = 0\r\nsession.bug_compat_42 = 0\r\nsession.bug_compat_warn = 1\r\nsession.cache_expire = 180\r\nsession.cache_limiter = nocache\r\nsession.cookie_domain =\r\nsession.cookie_lifetime = 0\r\nsession.cookie_path = /\r\nsession.entropy_file = /dev/urandom\r\nsession.entropy_length = 16\r\nsession.gc_divisor = 1000\r\nsession.gc_maxlifetime = 1440\r\nsession.gc_probability = 1\r\nsession.name = PHPSESSID\r\nsession.referer_check =\r\nsession.save_handler = files\r\nsession.save_path = \"{TMP_DIR}\"\r\nsession.serialize_handler = php\r\nsession.use_cookies = 1\r\nsession.use_trans_sid = 0\r\nshort_open_tag = On\r\nsuhosin.mail.protect = 1\r\nsuhosin.simulation = Off\r\ntrack_errors = Off\r\nupload_max_filesize = 32M\r\nupload_tmp_dir = \"{TMP_DIR}\"\r\nvariables_order = \"GPCS\"\r\n;mail.add_x_header = On\r\n;mail.log = \"/var/log/phpmail.log\"\r\nopcache.restrict_api = \"\"\r\n',1,0);
/*!40000 ALTER TABLE `panel_phpconfigs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_sessions`
--

DROP TABLE IF EXISTS `panel_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_sessions` (
  `hash` varchar(32) NOT NULL DEFAULT '',
  `userid` int(11) unsigned NOT NULL DEFAULT 0,
  `ipaddress` varchar(255) NOT NULL DEFAULT '',
  `useragent` varchar(255) NOT NULL DEFAULT '',
  `lastactivity` int(11) unsigned NOT NULL DEFAULT 0,
  `lastpaging` varchar(255) NOT NULL DEFAULT '',
  `formtoken` char(32) NOT NULL DEFAULT '',
  `language` varchar(64) NOT NULL DEFAULT '',
  `adminsession` tinyint(1) unsigned NOT NULL DEFAULT 0,
  `theme` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`hash`),
  KEY `userid` (`userid`)
) ENGINE=MEMORY DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_sessions`
--

LOCK TABLES `panel_sessions` WRITE;
/*!40000 ALTER TABLE `panel_sessions` DISABLE KEYS */;
INSERT INTO `panel_sessions` VALUES ('94db74abff176f40b236f7a1d5bb3b4c',1,'10.0.2.100','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0',1674141370,'','','English',1,'Sparkle');
/*!40000 ALTER TABLE `panel_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_settings`
--

DROP TABLE IF EXISTS `panel_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_settings` (
  `settingid` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `settinggroup` varchar(255) NOT NULL DEFAULT '',
  `varname` varchar(255) NOT NULL DEFAULT '',
  `value` text NOT NULL,
  PRIMARY KEY (`settingid`)
) ENGINE=MyISAM AUTO_INCREMENT=248 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_settings`
--

LOCK TABLES `panel_settings` WRITE;
/*!40000 ALTER TABLE `panel_settings` DISABLE KEYS */;
INSERT INTO `panel_settings` VALUES (1,'catchall','catchall_enabled','1'),(2,'session','allow_multiple_login','0'),(3,'session','sessiontimeout','600'),(4,'customer','accountprefix','web'),(5,'customer','ftpprefix','ftp'),(6,'customer','mysqlprefix','sql'),(7,'customer','ftpatdomain','0'),(8,'customer','show_news_feed','0'),(9,'customer','news_feed_url',''),(10,'ticket','noreply_email','NO-REPLY@SERVERNAME'),(11,'ticket','worktime_all','1'),(12,'ticket','worktime_begin','00:00'),(13,'ticket','worktime_end','23:59'),(14,'ticket','worktime_sat','0'),(15,'ticket','worktime_sun','0'),(16,'ticket','archiving_days','5'),(17,'ticket','enabled','1'),(18,'ticket','concurrently_open','5'),(19,'ticket','noreply_name','Hosting Support'),(20,'ticket','reset_cycle','2'),(21,'logger','enabled','1'),(22,'logger','log_cron','0'),(23,'logger','logfile',''),(24,'logger','logtypes','syslog,mysql'),(25,'logger','severity','1'),(26,'dkim','use_dkim','0'),(27,'dkim','dkim_prefix','/etc/postfix/dkim/'),(28,'dkim','dkim_domains','domains'),(29,'dkim','dkim_dkimkeys','dkim-keys.conf'),(30,'dkim','dkimrestart_command','/etc/init.d/dkim-filter restart'),(31,'admin','show_news_feed','1'),(32,'admin','show_version_login','0'),(33,'admin','show_version_footer','0'),(34,'spf','use_spf','0'),(35,'spf','spf_entry','\"v=spf1 a mx -all\"'),(36,'dkim','dkim_algorithm','all'),(37,'dkim','dkim_add_adsp','1'),(38,'dkim','dkim_keylength','1024'),(39,'dkim','dkim_servicetype','0'),(40,'dkim','dkim_add_adsppolicy','1'),(41,'dkim','dkim_notes',''),(42,'defaultwebsrverrhandler','enabled','0'),(43,'defaultwebsrverrhandler','err401',''),(44,'defaultwebsrverrhandler','err403',''),(45,'defaultwebsrverrhandler','err404',''),(46,'defaultwebsrverrhandler','err500',''),(47,'ticket','default_priority','2'),(48,'customredirect','enabled','1'),(49,'customredirect','default','1'),(50,'perl','suexecworkaround','0'),(51,'perl','suexecpath','/var/www/cgi-bin/'),(52,'login','domain_login','0'),(53,'login','maxloginattempts','3'),(54,'login','deactivatetime','900'),(55,'phpfpm','enabled','0'),(56,'phpfpm','configdir','/etc/php-fpm.d/'),(57,'phpfpm','reload','/etc/init.d/php-fpm restart'),(58,'phpfpm','pm','static'),(59,'phpfpm','max_children','1'),(60,'phpfpm','start_servers','20'),(61,'phpfpm','min_spare_servers','5'),(62,'phpfpm','max_spare_servers','35'),(63,'phpfpm','max_requests','0'),(64,'phpfpm','tmpdir','/var/customers/tmp/'),(65,'phpfpm','peardir','/usr/share/php/:/usr/share/php5/'),(66,'phpfpm','envpath','/usr/local/bin:/usr/bin:/bin'),(67,'phpfpm','enabled_ownvhost','0'),(68,'phpfpm','vhost_httpuser','froxlorlocal'),(69,'phpfpm','vhost_httpgroup','froxlorlocal'),(70,'phpfpm','idle_timeout','30'),(71,'phpfpm','aliasconfigdir','/var/www/php-fpm/'),(72,'phpfpm','defaultini','1'),(73,'phpfpm','vhost_defaultini','2'),(74,'phpfpm','fastcgi_ipcdir','/var/lib/apache2/fastcgi/'),(75,'phpfpm','use_mod_proxy','0'),(76,'phpfpm','ini_flags','asp_tags\ndisplay_errors\ndisplay_startup_errors\nhtml_errors\nlog_errors\nmagic_quotes_gpc\nmagic_quotes_runtime\nmagic_quotes_sybase\nmail.add_x_header\nsession.cookie_secure\nsession.use_cookies\nshort_open_tag\ntrack_errors\nxmlrpc_errors\nsuhosin.simulation\nsuhosin.session.encrypt\nsuhosin.session.cryptua\nsuhosin.session.cryptdocroot\nsuhosin.cookie.encrypt\nsuhosin.cookie.cryptua\nsuhosin.cookie.cryptdocroot\nsuhosin.executor.disable_eval\nmbstring.func_overload'),(77,'phpfpm','ini_values','auto_append_file\nauto_prepend_file\ndate.timezone\ndefault_charset\nerror_reporting\ninclude_path\nlog_errors_max_len\nmail.log\nmax_execution_time\nsession.cookie_domain\nsession.cookie_lifetime\nsession.cookie_path\nsession.name\nsession.serialize_handler\nupload_max_filesize\nxmlrpc_error_number\nsession.auto_start\nalways_populate_raw_post_data\nsuhosin.session.cryptkey\nsuhosin.session.cryptraddr\nsuhosin.session.checkraddr\nsuhosin.cookie.cryptkey\nsuhosin.cookie.plainlist\nsuhosin.cookie.cryptraddr\nsuhosin.cookie.checkraddr\nsuhosin.executor.func.blacklist\nsuhosin.executor.eval.whitelist'),(78,'phpfpm','ini_admin_flags','allow_call_time_pass_reference\nallow_url_fopen\nallow_url_include\nauto_detect_line_endings\ncgi.fix_pathinfo\ncgi.force_redirect\nenable_dl\nexpose_php\nfile_uploads\nignore_repeated_errors\nignore_repeated_source\nlog_errors\nregister_argc_argv\nreport_memleaks\nopcache.enable\nopcache.consistency_checks\nopcache.dups_fix\nopcache.load_comments\nopcache.revalidate_path\nopcache.save_comments\nopcache.use_cwd\nopcache.validate_timestamps\nopcache.fast_shutdown'),(79,'phpfpm','ini_admin_values','cgi.redirect_status_env\ndate.timezone\ndisable_classes\ndisable_functions\nerror_log\ngpc_order\nmax_input_time\nmax_input_vars\nmemory_limit\nopen_basedir\noutput_buffering\npost_max_size\nprecision\nsendmail_path\nsession.gc_divisor\nsession.gc_probability\nvariables_order\nopcache.log_verbosity_level\nopcache.restrict_api\nopcache.revalidate_freq\nopcache.max_accelerated_files\nopcache.memory_consumption\nopcache.interned_strings_buffer'),(80,'nginx','fastcgiparams','/etc/nginx/fastcgi_params'),(81,'system','lastaccountnumber','0'),(82,'system','lastguid','9999'),(83,'system','documentroot_prefix','/var/customers/webs/'),(84,'system','logfiles_directory','/var/customers/logs/'),(85,'system','ipaddress','10.0.2.100'),(86,'system','apachereload_command','/etc/init.d/apache2 reload'),(87,'system','last_traffic_run','000000'),(88,'system','vmail_uid','2000'),(89,'system','vmail_gid','2000'),(90,'system','vmail_homedir','/var/customers/mail/'),(91,'system','vmail_maildirname','Maildir'),(92,'system','bind_enable','1'),(93,'system','bindconf_directory','/etc/bind/'),(94,'system','bindreload_command','/etc/init.d/bind9 reload'),(95,'system','hostname','localhost'),(96,'system','mysql_access_host','10.0.2.100,10.0.2.100'),(97,'system','lastcronrun','1674141328'),(98,'system','defaultip','2'),(99,'system','phpappendopenbasedir','/tmp/'),(100,'system','deactivateddocroot',''),(101,'system','mailpwcleartext','1'),(102,'system','last_tasks_run','000000'),(103,'system','nameservers',''),(104,'system','mxservers',''),(105,'system','mod_fcgid','0'),(106,'system','apacheconf_vhost','/etc/apache2/sites-enabled/'),(107,'system','apacheconf_diroptions','/etc/apache2/sites-enabled/'),(108,'system','apacheconf_htpasswddir','/etc/apache2/htpasswd/'),(109,'system','webalizer_quiet','2'),(110,'system','last_archive_run','000000'),(111,'system','mod_fcgid_configdir','/var/www/php-fcgi-scripts'),(112,'system','mod_fcgid_tmpdir','/var/customers/tmp'),(113,'system','ssl_cert_file','/etc/apache2/apache2.pem'),(114,'system','use_ssl','0'),(115,'system','default_vhostconf',''),(116,'system','mail_quota_enabled','0'),(117,'system','mail_quota','100'),(118,'system','webalizer_enabled','1'),(119,'system','awstats_enabled','0'),(120,'system','httpuser','www-data'),(121,'system','httpgroup','www-data'),(122,'system','webserver','apache2'),(123,'system','mod_fcgid_wrapper','1'),(124,'system','mod_fcgid_starter','0'),(125,'system','mod_fcgid_peardir','/usr/share/php/:/usr/share/php5/'),(126,'system','index_file_extension','html'),(127,'system','mod_fcgid_maxrequests','250'),(128,'system','ssl_key_file','/etc/apache2/apache2.key'),(129,'system','ssl_ca_file',''),(130,'system','debug_cron','0'),(131,'system','store_index_file_subs','1'),(132,'system','stdsubdomain',''),(133,'system','awstats_path','/usr/bin/'),(134,'system','awstats_conf','/etc/awstats/'),(135,'system','defaultttl','604800'),(136,'system','mod_fcgid_defaultini','1'),(137,'system','ftpserver','proftpd'),(138,'system','dns_createmailentry','0'),(139,'system','froxlordirectlyviahostname','0'),(140,'system','report_enable','1'),(141,'system','report_webmax','90'),(142,'system','report_trafficmax','90'),(143,'system','validate_domain','1'),(144,'system','diskquota_enabled','0'),(145,'system','diskquota_repquota_path','/usr/sbin/repquota'),(146,'system','diskquota_quotatool_path','/usr/bin/quotatool'),(147,'system','diskquota_customer_partition','/dev/root'),(148,'system','mod_fcgid_idle_timeout','30'),(149,'system','perl_path','/usr/bin/perl'),(150,'system','mod_fcgid_ownvhost','0'),(151,'system','mod_fcgid_httpuser','froxlorlocal'),(152,'system','mod_fcgid_httpgroup','froxlorlocal'),(153,'system','awstats_awstatspath','/usr/bin/'),(154,'system','mod_fcgid_defaultini_ownvhost','2'),(155,'system','awstats_icons','/usr/share/awstats/icon/'),(156,'system','ssl_cert_chainfile',''),(157,'system','ssl_cipher_list','ECDH+AESGCM:ECDH+AES256:!aNULL:!MD5:!DSS:!DH:!AES128'),(158,'system','nginx_php_backend','127.0.0.1:8888'),(159,'system','http2_support','0'),(160,'system','perl_server','unix:/var/run/nginx/cgiwrap-dispatch.sock'),(161,'system','phpreload_command',''),(162,'system','apache24','1'),(163,'system','apache24_ocsp_cache_path','shmcb:/var/run/apache2/ocsp-stapling.cache(131072)'),(164,'system','documentroot_use_default_value','0'),(165,'system','passwordcryptfunc','3'),(166,'system','axfrservers',''),(167,'system','customer_ssl_path','/etc/ssl/froxlor-custom/'),(168,'system','allow_error_report_admin','1'),(169,'system','allow_error_report_customer','0'),(170,'system','mdalog','/var/log/mail.log'),(171,'system','mtalog','/var/log/mail.log'),(172,'system','mdaserver','dovecot'),(173,'system','mtaserver','postfix'),(174,'system','mailtraffic_enabled','1'),(175,'system','cronconfig','/etc/cron.d/froxlor'),(176,'system','crondreload','/etc/init.d/cron reload'),(177,'system','croncmdline','/usr/bin/nice -n 5 /usr/bin/php -q'),(178,'system','cron_allowautoupdate','0'),(179,'system','dns_createhostnameentry','0'),(180,'system','send_cron_errors','0'),(181,'system','apacheitksupport','0'),(182,'system','leprivatekey','unset'),(183,'system','lepublickey','unset'),(184,'system','letsencryptca','production'),(185,'system','letsencryptcountrycode','DE'),(186,'system','letsencryptstate','Hessen'),(187,'system','letsencryptchallengepath','/var/www/html/froxlor'),(188,'system','letsencryptkeysize','4096'),(189,'system','letsencryptreuseold','0'),(190,'system','leenabled','0'),(191,'system','leapiversion','1'),(192,'system','backupenabled','0'),(193,'system','dnsenabled','0'),(194,'system','dns_server','bind'),(195,'system','apacheglobaldiropt',''),(196,'system','allow_customer_shell','0'),(197,'system','available_shells',''),(198,'system','le_froxlor_enabled','0'),(199,'system','le_froxlor_redirect','0'),(200,'system','letsencryptacmeconf','/etc/apache2/conf-enabled/acme.conf'),(201,'system','mail_use_smtp','0'),(202,'system','mail_smtp_host','localhost'),(203,'system','mail_smtp_port','25'),(204,'system','mail_smtp_usetls','1'),(205,'system','mail_smtp_auth','1'),(206,'system','mail_smtp_user',''),(207,'system','mail_smtp_passwd',''),(208,'system','hsts_maxage','0'),(209,'system','hsts_incsub','0'),(210,'system','hsts_preload','0'),(211,'system','leregistered','0'),(212,'system','nssextrausers','0'),(213,'system','disable_le_selfcheck','0'),(214,'system','ssl_protocols','TLSv1,TLSv1.2'),(215,'panel','decimal_places','4'),(216,'panel','adminmail','admin@localhost'),(217,'panel','phpmyadmin_url',''),(218,'panel','webmail_url',''),(219,'panel','webftp_url',''),(220,'panel','standardlanguage','English'),(221,'panel','pathedit','Manual'),(222,'panel','paging','20'),(223,'panel','natsorting','1'),(224,'panel','sendalternativemail','0'),(225,'panel','no_robots','1'),(226,'panel','allow_domain_change_admin','0'),(227,'panel','allow_domain_change_customer','0'),(228,'panel','frontend','froxlor'),(229,'panel','default_theme','Sparkle'),(230,'panel','password_min_length','0'),(231,'panel','adminmail_defname','Froxlor Administrator'),(232,'panel','adminmail_return',''),(233,'panel','unix_names','1'),(234,'panel','allow_preset','1'),(235,'panel','allow_preset_admin','0'),(236,'panel','password_regex',''),(237,'panel','phpconfigs_hidestdsubdomain','0'),(238,'panel','allow_theme_change_admin','1'),(239,'panel','allow_theme_change_customer','1'),(240,'panel','password_alpha_lower','1'),(241,'panel','password_alpha_upper','1'),(242,'panel','password_numeric','0'),(243,'panel','password_special_char_required','0'),(244,'panel','password_special_char','!?<>Â§$%+#=@'),(245,'panel','customer_hide_options',''),(246,'panel','version','0.9.39'),(247,'panel','db_version','201801260');
/*!40000 ALTER TABLE `panel_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_syslog`
--

DROP TABLE IF EXISTS `panel_syslog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_syslog` (
  `logid` bigint(20) NOT NULL AUTO_INCREMENT,
  `action` int(5) NOT NULL DEFAULT 10,
  `type` int(5) NOT NULL DEFAULT 0,
  `date` int(15) NOT NULL,
  `user` varchar(50) NOT NULL,
  `text` text NOT NULL,
  PRIMARY KEY (`logid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_syslog`
--

LOCK TABLES `panel_syslog` WRITE;
/*!40000 ALTER TABLE `panel_syslog` DISABLE KEYS */;
/*!40000 ALTER TABLE `panel_syslog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_tasks`
--

DROP TABLE IF EXISTS `panel_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_tasks` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `type` int(11) NOT NULL DEFAULT 0,
  `data` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_tasks`
--

LOCK TABLES `panel_tasks` WRITE;
/*!40000 ALTER TABLE `panel_tasks` DISABLE KEYS */;
INSERT INTO `panel_tasks` VALUES (1,99,NULL),(2,99,NULL);
/*!40000 ALTER TABLE `panel_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_templates`
--

DROP TABLE IF EXISTS `panel_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `adminid` int(11) NOT NULL DEFAULT 0,
  `language` varchar(255) NOT NULL DEFAULT '',
  `templategroup` varchar(255) NOT NULL DEFAULT '',
  `varname` varchar(255) NOT NULL DEFAULT '',
  `value` longtext NOT NULL,
  PRIMARY KEY (`id`),
  KEY `adminid` (`adminid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_templates`
--

LOCK TABLES `panel_templates` WRITE;
/*!40000 ALTER TABLE `panel_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `panel_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_ticket_categories`
--

DROP TABLE IF EXISTS `panel_ticket_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_ticket_categories` (
  `id` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(60) NOT NULL,
  `adminid` int(11) NOT NULL,
  `logicalorder` int(3) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_ticket_categories`
--

LOCK TABLES `panel_ticket_categories` WRITE;
/*!40000 ALTER TABLE `panel_ticket_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `panel_ticket_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_tickets`
--

DROP TABLE IF EXISTS `panel_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_tickets` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `customerid` int(11) NOT NULL,
  `adminid` int(11) NOT NULL,
  `category` smallint(5) unsigned NOT NULL DEFAULT 1,
  `priority` enum('1','2','3') NOT NULL DEFAULT '3',
  `subject` varchar(70) NOT NULL,
  `message` text NOT NULL,
  `dt` int(15) NOT NULL,
  `lastchange` int(15) NOT NULL,
  `ip` varchar(39) NOT NULL DEFAULT '',
  `status` enum('0','1','2','3') NOT NULL DEFAULT '1',
  `lastreplier` enum('0','1') NOT NULL DEFAULT '0',
  `answerto` int(11) unsigned NOT NULL,
  `by` enum('0','1') NOT NULL DEFAULT '0',
  `archived` enum('0','1') NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `customerid` (`customerid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_tickets`
--

LOCK TABLES `panel_tickets` WRITE;
/*!40000 ALTER TABLE `panel_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `panel_tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_traffic`
--

DROP TABLE IF EXISTS `panel_traffic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_traffic` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `customerid` int(11) unsigned NOT NULL DEFAULT 0,
  `year` int(4) unsigned zerofill NOT NULL DEFAULT 0000,
  `month` int(2) unsigned zerofill NOT NULL DEFAULT 00,
  `day` int(2) unsigned zerofill NOT NULL DEFAULT 00,
  `stamp` int(11) unsigned NOT NULL DEFAULT 0,
  `http` bigint(30) unsigned NOT NULL DEFAULT 0,
  `ftp_up` bigint(30) unsigned NOT NULL DEFAULT 0,
  `ftp_down` bigint(30) unsigned NOT NULL DEFAULT 0,
  `mail` bigint(30) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `customerid` (`customerid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_traffic`
--

LOCK TABLES `panel_traffic` WRITE;
/*!40000 ALTER TABLE `panel_traffic` DISABLE KEYS */;
/*!40000 ALTER TABLE `panel_traffic` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panel_traffic_admins`
--

DROP TABLE IF EXISTS `panel_traffic_admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `panel_traffic_admins` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `adminid` int(11) unsigned NOT NULL DEFAULT 0,
  `year` int(4) unsigned zerofill NOT NULL DEFAULT 0000,
  `month` int(2) unsigned zerofill NOT NULL DEFAULT 00,
  `day` int(2) unsigned zerofill NOT NULL DEFAULT 00,
  `stamp` int(11) unsigned NOT NULL DEFAULT 0,
  `http` bigint(30) unsigned NOT NULL DEFAULT 0,
  `ftp_up` bigint(30) unsigned NOT NULL DEFAULT 0,
  `ftp_down` bigint(30) unsigned NOT NULL DEFAULT 0,
  `mail` bigint(30) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `adminid` (`adminid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panel_traffic_admins`
--

LOCK TABLES `panel_traffic_admins` WRITE;
/*!40000 ALTER TABLE `panel_traffic_admins` DISABLE KEYS */;
/*!40000 ALTER TABLE `panel_traffic_admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `redirect_codes`
--

DROP TABLE IF EXISTS `redirect_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `redirect_codes` (
  `id` int(5) NOT NULL AUTO_INCREMENT,
  `code` varchar(3) NOT NULL,
  `desc` varchar(200) NOT NULL,
  `enabled` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `redirect_codes`
--

LOCK TABLES `redirect_codes` WRITE;
/*!40000 ALTER TABLE `redirect_codes` DISABLE KEYS */;
INSERT INTO `redirect_codes` VALUES (1,'---','rc_default',1),(2,'301','rc_movedperm',1),(3,'302','rc_found',1),(4,'303','rc_seeother',1),(5,'307','rc_tempred',1);
/*!40000 ALTER TABLE `redirect_codes` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-01-19 15:16:51
