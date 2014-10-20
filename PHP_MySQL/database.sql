-- phpMyAdmin SQL Dump
-- version 4.1.8
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Oct 15, 2014 at 10:10 PM
-- Server version: 5.5.36-cll-lve
-- PHP Version: 5.4.23

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `YOUR_DB`
--

-- --------------------------------------------------------

--
-- Table structure for table `treasure_hunt`
--

CREATE TABLE IF NOT EXISTS `treasure_hunt` (
  `badgeID` int(6) NOT NULL AUTO_INCREMENT COMMENT 'Unique Badge ID',
  `badgeName` text NOT NULL COMMENT 'Broadcasted Name in BLE',
  `hintName` text NOT NULL, COMMENT 'Displayed name for hint - dont be obvious here',
  `clue1` text NOT NULL COMMENT 'Obscure Clue',
  `clue2` text NOT NULL COMMENT 'Vague Clue',
  `clue3` text NOT NULL COMMENT 'Easy Clue',
  `picture` text NOT NULL COMMENT 'Name of associated picture to be displayed',
  PRIMARY KEY (`badgeID`),
  UNIQUE KEY `badgeID` (`badgeID`),
  KEY `badgeID_2` (`badgeID`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 COMMENT='Store Treasure Hunt Info' AUTO_INCREMENT=4 ;

--
-- Dumping data for table `treasure_hunt`
--

INSERT INTO `treasure_hunt` (`badgeID`, `badgeName`, `hintName`, `clue1`, `clue2`, `clue3`, `picture`) VALUES
(1, 'Surf Shack Sign', 'Sign of the Times', 'A sign of good surf?', 'Home is where the hunt is.', 'Put your surfboards by the shack.', 'sign'),
(2, 'Pool Slide', 'Beat the Heat', 'A refreshing waterfall.', 'Source of Summer Fun.', 'Slippin into the pool.', 'slide'),
(3, 'Kitchen', 'Center of the Party', 'Make some heat if you wanna eat.', 'Create culinary delights.', 'With a wisk, spatula, and Blade; this is where your meal is made.', 'kitchen');

-- --------------------------------------------------------

--
-- Table structure for table `treasure_hunt_info`
--

CREATE TABLE IF NOT EXISTS `treasure_hunt_info` (
  `huntID` int(11) NOT NULL,
  `huntName` text NOT NULL COMMENT 'Name of the Hunt',
  `huntVersion` date NOT NULL COMMENT 'Date of last revision'
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COMMENT='Holds General Treasure Hunt info';

--
-- Dumping data for table `treasure_hunt_info`
--

INSERT INTO `treasure_hunt_info` (`huntID`, `huntName`, `huntVersion`) VALUES
(1, 'Beach Beacon Hunt', '2014-10-10');

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
