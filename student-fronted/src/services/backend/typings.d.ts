declare namespace API {
  type BaseResponseBoolean_ = {
    code?: number;
    data?: boolean;
    message?: string;
  };

  type BaseResponseInt_ = {
    code?: number;
    data?: number;
    message?: string;
  };

  type BaseResponseLoginUserVO_ = {
    code?: number;
    data?: LoginUserVO;
    message?: string;
  };

  type BaseResponseLong_ = {
    code?: number;
    data?: string;
    message?: string;
  };

  type BaseResponsePagePost_ = {
    code?: number;
    data?: PagePost_;
    message?: string;
  };

  type BaseResponsePagePostVO_ = {
    code?: number;
    data?: PagePostVO_;
    message?: string;
  };

  type BaseResponsePageUser_ = {
    code?: number;
    data?: PageUser_;
    message?: string;
  };

  type BaseResponsePageUserVO_ = {
    code?: number;
    data?: PageUserVO_;
    message?: string;
  };

  type BaseResponsePostVO_ = {
    code?: number;
    data?: PostVO;
    message?: string;
  };

  type BaseResponseString_ = {
    code?: number;
    data?: string;
    message?: string;
  };

  type BaseResponseUser_ = {
    code?: number;
    data?: User;
    message?: string;
  };

  type BaseResponseUserVO_ = {
    code?: number;
    data?: UserVO;
    message?: string;
  };

  type checkUsingGETParams = {
    /** echostr */
    echostr?: string;
    /** nonce */
    nonce?: string;
    /** signature */
    signature?: string;
    /** timestamp */
    timestamp?: string;
  };

  type DeleteRequest = {
    id?: string;
  };

  type getPostVOByIdUsingGETParams = {
    /** id */
    id?: string;
  };

  type getUserByIdUsingGETParams = {
    /** id */
    id?: string;
  };

  type getUserVOByIdUsingGETParams = {
    /** id */
    id?: string;
  };

  type LoginUserVO = {
    createTime?: string;
    id?: string;
    updateTime?: string;
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
    studentId?: string;
    realName?: string;
    gender?: number;
    phone?: string;
    college?: string;
    major?: string;
    enrollmentYear?: number;
  };

  type OrderItem = {
    asc?: boolean;
    column?: string;
  };

  type PagePost_ = {
    countId?: string;
    current?: string;
    maxLimit?: string;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: string;
    records?: Post[];
    searchCount?: boolean;
    size?: string;
    total?: string;
  };

  type PagePostVO_ = {
    countId?: string;
    current?: string;
    maxLimit?: string;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: string;
    records?: PostVO[];
    searchCount?: boolean;
    size?: string;
    total?: string;
  };

  type BaseResponseActivityVO_ = {
    code?: number;
    data?: ActivityVO;
    message?: string;
  };

  type BaseResponseListMapStringObject_ = {
    code?: number;
    data?: Array<Record<string, any>>;
    message?: string;
  };

  type PageUser_ = {
    countId?: string;
    current?: string;
    maxLimit?: string;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: string;
    records?: User[];
    searchCount?: boolean;
    size?: string;
    total?: string;
  };

  type PageUserVO_ = {
    countId?: string;
    current?: string;
    maxLimit?: string;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: string;
    records?: UserVO[];
    searchCount?: boolean;
    size?: string;
    total?: string;
  };

  type Post = {
    content?: string;
    createTime?: string;
    favourNum?: number;
    id?: string;
    isDelete?: number;
    tags?: string;
    thumbNum?: number;
    title?: string;
    updateTime?: string;
    userId?: string;
  };

  type PostAddRequest = {
    content?: string;
    tags?: string[];
    title?: string;
  };

  type PostEditRequest = {
    content?: string;
    id?: string;
    tags?: string[];
    title?: string;
  };

  type PostFavourAddRequest = {
    postId?: string;
  };

  type PostFavourQueryRequest = {
    current?: number;
    pageSize?: number;
    postQueryRequest?: PostQueryRequest;
    sortField?: string;
    sortOrder?: string;
    userId?: string;
  };

  type PostQueryRequest = {
    content?: string;
    current?: number;
    favourUserId?: string;
    id?: string;
    notId?: string;
    orTags?: string[];
    pageSize?: number;
    searchText?: string;
    sortField?: string;
    sortOrder?: string;
    tags?: string[];
    title?: string;
    userId?: string;
  };

  type PostThumbAddRequest = {
    postId?: string;
  };

  type PostUpdateRequest = {
    content?: string;
    id?: string;
    tags?: string[];
    title?: string;
  };

  type PostVO = {
    content?: string;
    createTime?: string;
    favourNum?: number;
    hasFavour?: boolean;
    hasThumb?: boolean;
    id?: string;
    tagList?: string[];
    thumbNum?: number;
    title?: string;
    updateTime?: string;
    user?: UserVO;
    userId?: string;
  };

  type uploadFileUsingPOSTParams = {
    biz?: string;
  };

  type User = {
    createTime?: string;
    id?: string;
    isDelete?: number;
    mpOpenId?: string;
    unionId?: string;
    updateTime?: string;
    userAccount?: string;
    userAvatar?: string;
    userName?: string;
    userPassword?: string;
    userProfile?: string;
    userRole?: string;
    studentId?: string;
    realName?: string;
    gender?: number;
    phone?: string;
    college?: string;
    major?: string;
    enrollmentYear?: number;
  };

  type UserAddRequest = {
    userAccount?: string;
    userAvatar?: string;
    userName?: string;
    userRole?: string;
    studentId?: string;
    realName?: string;
    gender?: number;
    phone?: string;
    college?: string;
    major?: string;
    enrollmentYear?: number;
  };

  type userLoginByWxOpenUsingGETParams = {
    /** code */
    code: string;
  };

  type UserLoginRequest = {
    userAccount?: string;
    userPassword?: string;
  };

  type UserQueryRequest = {
    current?: number;
    id?: string;
    mpOpenId?: string;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    unionId?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
    studentId?: string;
    realName?: string;
    gender?: number;
    phone?: string;
    college?: string;
    major?: string;
    enrollmentYear?: number;
  };

  type UserRegisterRequest = {
    checkPassword?: string;
    userAccount?: string;
    userPassword?: string;
    studentId?: string;
    realName?: string;
    gender?: number;
    phone?: string;
    college?: string;
    major?: string;
    enrollmentYear?: number;
  };

  type UserUpdateMyRequest = {
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
    studentId?: string;
    realName?: string;
    gender?: number;
    phone?: string;
    college?: string;
    major?: string;
    enrollmentYear?: number;
  };

  type UserUpdateRequest = {
    id?: string;
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
    studentId?: string;
    realName?: string;
    gender?: number;
    phone?: string;
    college?: string;
    major?: string;
    enrollmentYear?: number;
  };

  type UserVO = {
    createTime?: string;
    id?: string;
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
    studentId?: string;
    realName?: string;
    gender?: number;
    phone?: string;
    college?: string;
    major?: string;
    enrollmentYear?: number;
  };
  type ClubVO = {
    id?: string;
    clubName?: string;
    category?: string;
    description?: string;
    logo?: string;
    coverImage?: string;
    status?: number;
    maxMembers?: number;
    memberCount?: number;
    leaderId?: string;
    leaderName?: string;
    leaderAvatar?: string;
    userId?: string;
    joined?: boolean;
    myRole?: string;
    createTime?: string;
  };

  type ClubQueryRequest = {
    id?: string;
    clubName?: string;
    category?: string;
    status?: number;
    leaderId?: string;
    userId?: string;
    current?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
  };

  type ClubUpdateRequest = {
    id?: string;
    clubName?: string;
    category?: string;
    description?: string;
    logo?: string;
    coverImage?: string;
    maxMembers?: number;
    status?: number;
    leaderId?: string;
  };

  type BaseResponsePageClubVO_ = {
    code?: number;
    data?: PageClubVO_;
    message?: string;
  };

  type PageClubVO_ = {
    current?: string;
    pages?: string;
    records?: ClubVO[];
    size?: string;
    total?: string;
  };

  type BaseResponseClubVO_ = {
    code?: number;
    data?: ClubVO;
    message?: string;
  };

  type ActivityVO = {
    id?: string;
    clubId?: string;
    clubName?: string;
    title?: string;
    description?: string;
    category?: string;
    coverImage?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
    signupStart?: string;
    signupEnd?: string;
    maxSignup?: number;
    signupCount?: number;
    status?: number;
    userId?: string;
    user?: UserVO;
    signed?: boolean;
    createTime?: string;
  };

  type ActivityQueryRequest = {
    id?: string;
    clubId?: string;
    title?: string;
    category?: string;
    status?: number;
    userId?: string;
    current?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
  };

  type BaseResponsePageActivityVO_ = {
    code?: number;
    data?: PageActivityVO_;
    message?: string;
  };

  type PageActivityVO_ = {
    current?: string;
    pages?: string;
    records?: ActivityVO[];
    size?: string;
    total?: string;
  };

  type BaseResponseActivityVO_ = {
    code?: number;
    data?: ActivityVO;
    message?: string;
  };
}
