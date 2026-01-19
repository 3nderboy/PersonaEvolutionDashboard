---
configs:
- config_name: filtered_action
  data_files:
  - split: train
    path: OPeRA_filtered/action/train-*
  - split: test
    path: OPeRA_filtered/action/test-*
- config_name: filtered_image
  data_files:
  - split: train
    path: OPeRA_filtered/images/train-*
  - split: test
    path: OPeRA_filtered/images/test-*
- config_name: filtered_session
  data_files:
  - split: train
    path: OPeRA_filtered/session/train/train.parquet
  - split: test
    path: OPeRA_filtered/session/test/test.parquet
  description: Session-level records (filtered)
- config_name: filtered_user
  data_files:
  - split: train
    path: OPeRA_filtered/user/train/train.parquet
  - split: test
    path: OPeRA_filtered/user/test/test.parquet
  description: User-level records (filtered)
- config_name: full_action
  data_files:
  - split: train
    path: OPeRA_full/action/train-*
  - split: test
    path: OPeRA_full/action/test-*
- config_name: full_image
  data_files:
  - split: train
    path: OPeRA_full/images/train-*
  - split: test
    path: OPeRA_full/images/test-*
- config_name: full_session
  data_files:
  - split: train
    path: OPeRA_full/session/train/train.parquet
  - split: test
    path: OPeRA_full/session/test/test.parquet
  description: Session-level records (full)
- config_name: full_user
  data_files:
  - split: train
    path: OPeRA_full/user/train/train.parquet
  - split: test
    path: OPeRA_full/user/test/test.parquet
  description: User-level records (full)
license: cc-by-4.0
language:
- en
dataset_info:
- config_name: filtered_action
  features:
  - name: session_id
    dtype: string
  - name: action_id
    dtype: string
  - name: timestamp
    dtype: string
  - name: action_type
    dtype: string
  - name: click_type
    dtype: string
  - name: semantic_id
    dtype: string
  - name: mouse_position
    dtype: string
  - name: element_meta
    dtype: string
  - name: url
    dtype: string
  - name: window_size
    dtype: string
  - name: page_meta
    dtype: string
  - name: simplified_html
    dtype: string
  - name: rationale
    dtype: string
  - name: products
    dtype: string
  - name: input_text
    dtype: string
  - name: image
    dtype: string
  splits:
  - name: train
    num_bytes: 805238839
    num_examples: 4864
  - name: test
    num_bytes: 167389723
    num_examples: 992
  download_size: 153848837
  dataset_size: 972628562
- config_name: filtered_image
  features:
  - name: image
    dtype: image
  - name: image_name
    dtype: string
  splits:
  - name: train
    num_bytes: 521858125.33442354
    num_examples: 826
  - name: test
    num_bytes: 2612466510.863577
    num_examples: 4066
  download_size: 2304649826
  dataset_size: 3134324636.1980004
- config_name: full_action
  features:
  - name: session_id
    dtype: string
  - name: action_id
    dtype: string
  - name: timestamp
    dtype: string
  - name: action_type
    dtype: string
  - name: navigation_type
    dtype: string
  - name: simplified_html
    dtype: string
  - name: simplified_html_new_page
    dtype: string
  - name: url
    dtype: string
  - name: window_size
    dtype: string
  - name: page_meta
    dtype: string
  - name: rationale
    dtype: string
  - name: products
    dtype: string
  - name: scroll_detail
    dtype: string
  - name: click_type
    dtype: string
  - name: semantic_id
    dtype: string
  - name: target
    dtype: string
  - name: mouse_position
    dtype: string
  - name: element_meta
    dtype: string
  - name: input_text
    dtype: string
  - name: image
    dtype: string
  - name: image_new_page
    dtype: string
  splits:
  - name: train
    num_bytes: 5408609342
    num_examples: 24773
  - name: test
    num_bytes: 898655119
    num_examples: 4131
  download_size: 384830759
  dataset_size: 6307264461
- config_name: full_image
  features:
  - name: image
    dtype: image
  - name: image_name
    dtype: string
  splits:
  - name: train
    num_bytes: 6112425836.2753315
    num_examples: 10835
  - name: test
    num_bytes: 958662306.864669
    num_examples: 1459
  download_size: 5739497133
  dataset_size: 7071088143.14
---

# Dataset Card for Dataset Name

## Dataset Description
- **Paper:** https://arxiv.org/abs/2506.05606
- **Point of Contact:** [Ziyi Wang](mailto:wang.ziyi19@northeastern.edu)

### Dataset Summary
OPeRA is a dataset of Observation, Persona, Rationale, and Action collected from real human users during online shopping. OPeRA provides rich, time-aligned logs of users' web browsing behavior, completed with self-reported rationales and detailed self-reported persona profiles. Unlike prior datasets, OPeRA captures not only what users do but also why they do it, enabling deeper insights into decision-making processes. To ensure user privacy and data safety, the released dataset has undergone rigorous filtering and de-identification. It contains 692 shopping sessions from 51 unique users, 28,904 \<observation, action\> pairs, and 604 human-annotated rationales. OPeRA serves as the first benchmark dataset for evaluating LLM agents on personalized and verifiable user behavior simulation.

### Dataset Versions

This dataset comes in two versions:

1. **Full Version** : Includes the complete action space with all captured user interactions: 'click', 'scroll', 'input', 'navigation', and 'tabActivate'.

2. **Filtered Version** : Applies a simplification of the action space, leaving action types including 'click', 'input', and 'terminate'.

(The corresponding screenshots will be released soon)

### Dataset Structure

Both versions are organized into three main components stored as Parquet files:

```
OPeRA
├── full_user
│   ├── train
│   └── test
├── full_session
│   ├── train
│   └── test
├── full_action
│   ├── train
│   └── test
├── filtered_user
│   ├── train
│   └── test
├── filtered_session
│   ├── train
│   └── test
└── filtered_action
    ├── train
    └── test    

```

### Data Fields

#### User Table 
Contains user-level information including surveys and interviews:

- `user_id` (str): Anonymized unique identifier for each user
- `survey` (str): JSON string containing organized user survey responses about shopping preferences, demographics, and personality
- `raw_survey` (str): JSON string containing raw user survey responses
- `interview_transcript` (str): Transcript of user interview
- `interview_transcript_processed` (str): LLM-summarized version of the interview transcript

#### Session Table
Contains session-level information:

- `session_id` (str): Unique identifier for each shopping session (format: `{user_id}_{start_time}_{end_time}`)
- `user_id` (str): References the user who performed this session
- `action_count` (int): Number of actions in this session

#### Action Table - Full Version 
Contains action-level information with detailed interaction data for the full version:

**Fields:**
- `session_id` (str): References the session this action belongs to
- `action_id` (str): Unique identifier for each action
- `timestamp` (str): Action timestamp
- `action_type` (str): Type of action: `click`, `scroll`, `input`, `navigation`, `tab_activate`
- `url` (str): Masked web URL where the action occurred
- `window_size` (str): JSON string containing user's browser window dimensions
- `page_meta` (str): JSON string containing page metadata with masked URLs
- `simplified_html` (str): Simplified version of HTML content before the action happens
- `rationale` (str): User-provided rationale for this action (if applicable)
- `products` (str): JSON string containing information about list of products involved in this action (if applicable). Each product has fields:
  - `asin` (str): Amazon Standard Identification Number
  - `title` (str): Product title
  - `price` (str): Product price
  - `quantity` (int): Purchase quantity
  - `options` (list): Product options

**Action-Type Specific Fields:**

For `action_type == "click"`:
- `click_type` (str): Classification of click type. Possible values include:
  - `purchase`: Click on purchase intention related buttons (checkout, buy now, set subscription, add to cart)
  - `search`: Click on search buttons or search boxes
  - `review`: Click on review-related elements
  - `filter`: Click on filters
  - `quantity`: Click on quantity-related elements (quantity increase/decrease, delete item)
  - `product_option`: Click on product option selections (size, color, etc.)
  - `cart_side_bar`: Click on shopping cart sidebar elements
  - `suggested_term`: Click on suggested search terms
  - `nav_bar`: Click on navigation bar elements
  - `page_related`: Click on pagination elements or carousel navigation buttons
  - `cart_page_select`: Click on cart page selection elements (e.g. item checkbox)
  - `product_link`: Click on product links or product images
  - `other`: Other types of clicks not covered by the above categories
- `semantic_id` (str): Semantic identifier for the clicked element in simplified HTML
- `mouse_position` (str): JSON string containing mouse coordinates when clicking
- `element_meta` (str): JSON string containing element metadata with `name` and `data` fields

For `action_type == "input"`:
- `semantic_id` (str): Semantic identifier for the input element in simplified HTML
- `input_text` (str): Value entered in the input field
- `mouse_position` (str): JSON string containing mouse coordinates

For `action_type == "scroll"`:
- `scroll_detail` (str): JSON string containing scroll information with fields:
  - `scroll_current_top` (str): Current scroll position from top
  - `scroll_current_left` (str): Current scroll position from left
  - `scroll_distance_x` (str): Horizontal scroll distance
  - `scroll_distance_y` (str): Vertical scroll distance

For `action_type == "navigation"`:
- `navigation_type` (str): Type of navigation (back, forward, reload, new page)
- `simplified_html_new_page` (str): Simplified HTML content of the new page after navigation

For `action_type == "tab_activate"`:
- `simplified_html_new_page` (str): Simplified HTML content of the new page after navigation

#### Action Table - Filtered Version 
Contains action-level information with detailed interaction data for the filtered version:

**Fields:**
- `session_id` (str): References the session this action belongs to
- `action_id` (str): Unique identifier for each action
- `timestamp` (str): Action timestamp
- `action_type` (str): Type of action: `click`, `input`, `terminate`
- `url` (str): Masked web URL where the action occurred
- `window_size` (str): JSON string containing user's browser window dimensions
- `page_meta` (str): JSON string containing page metadata with masked URLs
- `simplified_html` (str): Simplified version of HTML content for easier parsing
- `rationale` (str): User-provided rationale for this action (if applicable)
- `products` (str): JSON string containing information about list of products involved in this action (if applicable). Each product has fields:
  - `asin` (str): Amazon Standard Identification Number
  - `title` (str): Product title
  - `price` (str): Product price
  - `quantity` (int): Purchase quantity
  - `options` (list): Product options

**Action-Type Specific Fields:**

For `action_type == "click"`:
- `click_type` (str): Classification of click type. Possible values include:
  - `purchase`: Click on purchase intention related buttons (checkout, buy now, set subscription, add to cart)
  - `search`: Click on search buttons or search boxes
  - `review`: Click on review-related elements
  - `filter`: Click on filters
  - `quantity`: Click on quantity-related elements (quantity increase/decrease, delete item)
  - `product_option`: Click on product option selections (size, color, etc.)
  - `cart_side_bar`: Click on shopping cart sidebar elements
  - `suggested_term`: Click on suggested search terms
  - `nav_bar`: Click on navigation bar elements
  - `page_related`: Click on pagination elements or carousel navigation buttons
  - `cart_page_select`: Click on cart page selection elements (e.g. item checkbox)
  - `product_link`: Click on product links or product images
  - `other`: Other types of clicks not covered by the above categories
- `semantic_id` (str): Semantic identifier for the clicked element in simplified HTML
- `mouse_position` (str): JSON string containing mouse coordinates when clicking
- `element_meta` (str): JSON string containing element metadata with `name` and `data` fields

For `action_type == "input"`:
- `semantic_id` (str): Semantic identifier for the input element in simplified HTML
- `input_text` (str): Value entered in the input field
- `mouse_position` (str): JSON string containing mouse coordinates

For `action_type == "terminate"`:
- No additional fields (indicates end of user session)

### Data Distribution
<img src="https://cdn-uploads.huggingface.co/production/uploads/684228fe624cd23497ab4735/2nxTGmC8oWHbUTm52Iy5l.png" width="600"/>
<img src="https://cdn-uploads.huggingface.co/production/uploads/684228fe624cd23497ab4735/RMQma91SkNFLABgcs9Hzd.png" width="600"/>
<img src="https://cdn-uploads.huggingface.co/production/uploads/684228fe624cd23497ab4735/FNhle39eqJ-IKtGlqngoR.png" width="600"/>


### Disclaimer
This dataset is intended for research purposes only. We hope it can contribute to the advancement of the NLP community. Please use it responsibly and refrain from any misuse or applications that could cause harm. By accessing the dataset, you agree to uphold these principles.

### Citation Information
```
@misc{wang2025operadatasetobservationpersona,
      title={OPeRA: A Dataset of Observation, Persona, Rationale, and Action for Evaluating LLMs on Human Online Shopping Behavior Simulation},
      author={Ziyi Wang and Yuxuan Lu and Wenbo Li and Amirali Amini and Bo Sun and Yakov Bart and Weimin Lyu and Jiri Gesi and Tian Wang and Jing Huang and Yu Su and Upol Ehsan and Malihe Alikhani and Toby Jia-Jun Li and Lydia Chilton and Dakuo Wang},
      year={2025},
      eprint={2506.05606},
      archivePrefix={arXiv},
      primaryClass={cs.CL},
      url={https://arxiv.org/abs/2506.05606},
}
```