export const paginate = (items, page, perPage) => {
    return items.slice((page - 1) * perPage, (page - 1) * perPage + perPage)
}