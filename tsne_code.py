import numpy as np
import pandas as pd
import sqlite3
from sklearn.manifold import TSNE
from sklearn.decomposition import TruncatedSVD
import matplotlib.pyplot as plt
from scipy.sparse import csr_matrix, coo_matrix, hstack
import json

articles['int_id'] = articles['id'].str.replace('W', '').astype(int)

all_concept_ids = set()

def extract_concept_ids(concepts_str):
    if pd.isna(concepts_str):
        return []
    concepts_list = concepts_str.split(',')
    int_concepts = []
    for cid in concepts_list:
        cid = cid.strip()
        if cid and cid.startswith('C'):
            try:
                int_cid = int(cid.replace('C', ''))
                int_concepts.append(int_cid)
                all_concept_ids.add(int_cid)
            except ValueError:
                print(f"Warning: Skipping invalid concept ID '{cid}'")
    return int_concepts

articles['concept_id_list'] = articles['concepts'].apply(extract_concept_ids)

dim_c = len(all_concept_ids)
print(f"hte dimension of the concept corpus: {dim_c}")

concept_id_list = sorted(list(all_concept_ids))
concept_id_to_index = {cid: idx for idx, cid in enumerate(concept_id_list)}


row_indices = []
col_indices = []
data_values = []

for idx, concept_ids in enumerate(articles['concept_id_list']):
    for cid in concept_ids:
        row_indices.append(idx)
        col_indices.append(concept_id_to_index[cid])
        data_values.append(1)

num_articles = articles.shape[0]
num_concepts = dim_c

# use boolean instead of ints here to save space
concept_matrix = coo_matrix((data_values, (row_indices, col_indices)), shape=(num_articles, num_concepts), dtype=bool)
concept_matrix = concept_matrix.tocsr()

min_date = articles['publication_date'].min()
max_date = articles['publication_date'].max()
articles['publication_date_normalized'] = (articles['publication_date'] - min_date) / (max_date - min_date)
publication_dates_normalized = articles['publication_date_normalized'].fillna(0).values.reshape(-1, 1)



svd = TruncatedSVD(n_components=50, random_state=42)
concept_matrix_reduced = svd.fit_transform(concept_matrix)

feature_matrix_reduced = np.hstack([publication_dates_normalized, concept_matrix_reduced])

tsne = TSNE(n_components=2, max_iter=300, perplexity=20, random_state=1000, verbose=1)  # Changed 'n_iter' to 'max_iter'
tsne_results = tsne.fit_transform(feature_matrix_reduced)
print('finished!')

articles['x_tsne'] = tsne_results[:, 0]
articles['y_tsne'] = tsne_results[:, 1]


# re append the Ws to article IDs and 'C's to the concept IDs
articles['id_with_W'] = 'W' + articles['int_id'].astype(str)

def reattach_C(concept_ids):
    return ['C' + str(cid) for cid in concept_ids]

articles['concept_ids_with_C'] = articles['concept_id_list'].apply(reattach_C)
print("IDs reattached.")

def process_references(ref_str):
    if pd.isna(ref_str):
        return []
    ref_list = ref_str.split(',')
    processed_refs = []
    for ref in ref_list:
        ref = ref.strip()
        if ref and ref.startswith('W'):
            processed_refs.append(ref)
        elif ref:
            print(f"Warning: Skipping invalid reference ID '{ref}'")
    return processed_refs

articles['references_processed'] = articles['references'].apply(process_references)
export_data = []

for idx, row in articles.iterrows():
    article_data = {
        'id': row['id_with_W'],
        'concept_ids': row['concept_ids_with_C'],
        'references': row['references_processed'],
        'display_name': row['display_name'],
        'doi': row['doi'],
        'x_tsne': float(row['x_tsne']),
        'y_tsne': float(row['y_tsne'])
    }
    export_data.append(article_data)
print('got here')

# exporting it here for the website
with open('website_ready.json', 'w') as f:
    json.dump(export_data, f)

plt.figure(figsize=(10, 8))
plt.scatter(articles['x_tsne'], articles['y_tsne'], s=1, alpha=0.6)
plt.show()