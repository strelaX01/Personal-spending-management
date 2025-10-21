-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 17, 2025 at 10:37 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `do-an`
--

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` varchar(255) NOT NULL,
  `date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`id`, `user_id`, `category_id`, `amount`, `description`, `date`) VALUES
(2, 16, 7, 40000.00, 'Mua áo', '2025-02-03'),
(4, 16, 7, 74656.00, 'lko', '2025-02-02'),
(6, 16, 8, 948000.00, '', '2025-02-12'),
(40, 16, 6, 30000.00, 'Ăn sáng', '2025-02-18'),
(41, 16, 6, 50000.00, 'Ăn trưa', '2025-02-18'),
(42, 16, 6, 30000.00, 'Ăn tối', '2025-02-18'),
(59, 16, 7, 35000.00, '', '2025-02-03'),
(60, 16, 6, 70000.00, '', '2025-02-19'),
(63, 16, 6, 100000.00, '', '2025-02-21'),
(69, 16, 6, 25000.00, 'Ăn sáng', '2025-03-09'),
(70, 16, 100, 3434.00, '', '2025-03-09'),
(71, 16, 91, 232323.00, '', '2025-03-09'),
(72, 16, 6, 25000.00, 'Ăn trưa', '2025-03-01'),
(73, 16, 6, 30000.00, 'Ăn tối', '2025-03-01'),
(74, 16, 8, 975000.00, '', '2025-03-10'),
(75, 16, 6, 35000.00, 'Ăn trưa', '2025-03-10'),
(77, 16, 7, 300000.00, 'Mua áo', '2025-03-08'),
(81, 16, 7, 50000.00, 'mua sữa', '2025-03-15'),
(82, 16, 6, 30000.00, 'Ăn trưa', '2025-03-16'),
(83, 16, 6, 35000.00, 'Ăn trưa', '2025-03-15'),
(84, 16, 6, 30000.00, 'Ăn tối', '2025-03-15'),
(85, 16, 6, 25000.00, 'Ăn trưa', '2025-03-02'),
(86, 16, 6, 30000.00, 'Ăn tối', '2025-03-02'),
(87, 16, 6, 30000.00, 'Ăn sáng', '2025-03-03'),
(88, 16, 6, 30000.00, 'Ăn trưa', '2025-03-03'),
(89, 16, 102, 30000.00, '', '2025-03-14'),
(90, 16, 92, 20000.00, 'Rửa xe', '2025-03-12'),
(91, 16, 6, 30000.00, 'Ăn tối', '2025-03-16');

-- --------------------------------------------------------

--
-- Table structure for table `expense_categories`
--

CREATE TABLE `expense_categories` (
  `category_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `category_color` varchar(7) NOT NULL,
  `category_icon` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `expense_categories`
--

INSERT INTO `expense_categories` (`category_id`, `user_id`, `category_name`, `category_color`, `category_icon`) VALUES
(6, 16, 'Ăn uống', '#FDBA74', 'heart'),
(7, 16, 'Mua sắm', '#FACC15', 'star'),
(8, 16, 'Tiền nhà', '#FB923C', 'videocam'),
(90, 88, 'giang', 'giang', 'giang'),
(91, 16, 'Quà tặng', '#00FF88', 'cart-outline'),
(92, 16, 'Sửa xe', '#FEC89A', 'medical'),
(102, 16, 'cafe', '#FECACA', 'cafe');

-- --------------------------------------------------------

--
-- Table structure for table `expense_plans`
--

CREATE TABLE `expense_plans` (
  `plan_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `category_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `expense_plans`
--

INSERT INTO `expense_plans` (`plan_id`, `user_id`, `date`, `category_id`, `amount`) VALUES
(94, 16, '2025-02-01', 6, 20000.00),
(95, 16, '2025-02-01', 7, 300000.00),
(96, 16, '2025-02-01', 8, 1000000.00),
(97, 16, '2025-02-01', 91, 0.00),
(98, 16, '2025-02-01', 92, 0.00),
(252, 16, '2025-03-01', 6, 2000000.00),
(253, 16, '2025-03-01', 7, 500000.00),
(254, 16, '2025-03-01', 8, 1000000.00),
(255, 16, '2025-03-01', 91, 200000.00),
(256, 16, '2025-03-01', 92, 100000.00),
(257, 16, '2025-03-01', 102, 100000.00);

-- --------------------------------------------------------

--
-- Table structure for table `incomes`
--

CREATE TABLE `incomes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` varchar(255) NOT NULL,
  `date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `incomes`
--

INSERT INTO `incomes` (`id`, `user_id`, `category_id`, `amount`, `description`, `date`) VALUES
(5, 16, 1, 3500000.00, 'Lương tháng 2', '2025-02-02'),
(6, 16, 6, 99999.00, '', '2025-02-03'),
(7, 16, 11, 50000.00, 'hgh', '2025-02-11'),
(9, 16, 6, 500000.00, '', '2025-02-11'),
(11, 16, 6, 343434.00, '', '2025-02-21'),
(12, 16, 5, 34344.00, '', '2025-02-21'),
(13, 16, 1, 5500000.00, '', '2025-03-10'),
(16, 16, 11, 344.00, '', '2025-03-09'),
(17, 16, 8, 5765.00, '', '2025-03-09'),
(19, 16, 5, 500000.00, '', '2025-03-10'),
(20, 22, 24, 435545.00, '', '2025-03-15'),
(23, 16, 6, 600000.00, '', '2025-03-15');

-- --------------------------------------------------------

--
-- Table structure for table `income_categories`
--

CREATE TABLE `income_categories` (
  `category_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `category_color` varchar(7) NOT NULL,
  `category_icon` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `income_categories`
--

INSERT INTO `income_categories` (`category_id`, `user_id`, `category_name`, `category_color`, `category_icon`) VALUES
(1, 16, 'lương', '#00FF88', 'rocket'),
(5, 16, 'Trợ cấp', '#DB2777', 'car'),
(6, 16, 'làm thêm', '#FCCFE8', 'heart'),
(24, 22, 'minecraft', '#00FF88', 'videocam');

-- --------------------------------------------------------

--
-- Table structure for table `income_plans`
--

CREATE TABLE `income_plans` (
  `plan_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `category_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `income_plans`
--

INSERT INTO `income_plans` (`plan_id`, `user_id`, `date`, `category_id`, `amount`) VALUES
(67, 16, '2025-02-01', 1, 3444.00),
(68, 16, '2025-02-01', 5, 5000000.00),
(69, 16, '2025-02-01', 6, 0.00),
(201, 16, '2025-03-01', 1, 5500000.00),
(202, 16, '2025-03-01', 5, 500000.00),
(203, 16, '2025-03-01', 6, 1000000.00);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `email` varchar(320) NOT NULL,
  `password` varchar(255) NOT NULL,
  `firstname` varchar(50) NOT NULL,
  `lastname` varchar(50) NOT NULL,
  `verification` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `email`, `password`, `firstname`, `lastname`, `verification`) VALUES
(15, 'hhhhh@gmail.com', '$2b$10$mzFf7IZQmiR2bDVnYb.5SuRQ02pc8SCJxW7Ov7QtPCEZSclmzIgUS', '', '', 1),
(16, 'hoanggiangstrela@gmail.com', '$2b$10$YK5Hi3MiaT64L1y4r3SY9OAArip7gxm1nScPLWJWlYDyRil0ofuhS', 'Hoàng', 'Giang', 1),
(24, 'hoanggiangminecraft@gmail.com', '$2b$10$xBbwPyLRylN2FT5yjZB50uaPA.5lCmvf77m9J.deDBM2xp7BeBbxm', 'Steven', 'Martinez', 0),
(25, 'dtc2054801310063@ictu.edu.vn', '$2b$10$k20NiDkEsPO4DdBRknjskOsdyyHgkBasbJCKYrqSP.zcisXVl304m', 'Thomas', 'Johnson', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `expense_categories`
--
ALTER TABLE `expense_categories`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `expense_plans`
--
ALTER TABLE `expense_plans`
  ADD PRIMARY KEY (`plan_id`);

--
-- Indexes for table `incomes`
--
ALTER TABLE `incomes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `income_categories`
--
ALTER TABLE `income_categories`
  ADD PRIMARY KEY (`category_id`);

--
-- Indexes for table `income_plans`
--
ALTER TABLE `income_plans`
  ADD PRIMARY KEY (`plan_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=92;

--
-- AUTO_INCREMENT for table `expense_categories`
--
ALTER TABLE `expense_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=103;

--
-- AUTO_INCREMENT for table `expense_plans`
--
ALTER TABLE `expense_plans`
  MODIFY `plan_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=258;

--
-- AUTO_INCREMENT for table `incomes`
--
ALTER TABLE `incomes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `income_categories`
--
ALTER TABLE `income_categories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `income_plans`
--
ALTER TABLE `income_plans`
  MODIFY `plan_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=204;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
